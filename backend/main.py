from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import asyncio
from datetime import datetime
import re
from pydantic import BaseModel

from . import models, database, auth, poller

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="ELM Winds Network Monitor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_db_seed():
    db = database.SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.username == "admin").first()
        if not user:
            print("[DB ENGINE] Seeding default admin user")
            hashed_password = auth.get_password_hash("changeme")
            db_user = models.User(username="admin", hashed_password=hashed_password, role="admin")
            db.add(db_user)
            db.commit()
    finally:
        db.close()

# === Auth Endpoints ===
@app.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = auth.timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/users/")
def create_user(username: str, password: str, role: str = "viewer", db: Session = Depends(database.get_db)):
    # Note: Protect this endpoint in production
    hashed_password = auth.get_password_hash(password)
    db_user = models.User(username=username, hashed_password=hashed_password, role=role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return {"id": db_user.id, "username": db_user.username, "role": db_user.role}

# === Node Inventory Endpoints ===
@app.get("/nodes/")
def get_nodes(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    nodes = db.query(models.NetworkNode).offset(skip).limit(limit).all()
    return nodes

@app.post("/nodes/")
def create_node(hostname: str, ip_address: str, vendor: str = None, model: str = None, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.require_role("admin"))):
    db_node = models.NetworkNode(hostname=hostname, ip_address=ip_address, vendor=vendor, model=model)
    db.add(db_node)
    db.commit()
    db.refresh(db_node)
    return db_node

@app.get("/me")
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return {"username": current_user.username, "role": current_user.role}

@app.post("/poll/")
async def trigger_poll(current_user: models.User = Depends(auth.require_role("admin"))):
    """Triggers an asynchronous polling cycle for all nodes."""
    results = await poller.run_polling_cycle()
    return {"message": "Polling completed", "polled_nodes": len(results), "results": results}

# === Dynamic Connector / Auto-Schema Engine ===
@app.post("/api/connectors/auto-ingest")
async def auto_ingest_data(table_name: str, payload: list, current_user: models.User = Depends(auth.require_role("admin"))):
    """
    Receives an arbitrary JSON payload array, dynamically infers data types,
    creates the SQLAlchemy database table if it doesn't exist, and inserts the records.
    """
    from .dynamic_db import insert_dynamic_records
    try:
        result = insert_dynamic_records(table_name, payload)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# === Syslog & Events Endpoints ===
@app.get("/api/logs")
def get_logs(limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    logs = db.query(models.SyslogEvent).order_by(models.SyslogEvent.timestamp.desc()).limit(limit).all()
    return [
        {
            "ts": log.timestamp.strftime("%Y-%m-%d %H:%M:%S") if log.timestamp else "",
            "severity": log.severity,
            "source": log.source,
            "facility": log.facility,
            "msg": log.msg,
            "enriched_data": log.enriched_data
        }
        for log in logs
    ]

class LogIngestRequest(BaseModel):
    raw_text: str
    source: str = "syslog"

@app.post("/api/logs/ingest_smart")
def ingest_smart(log: LogIngestRequest, db: Session = Depends(database.get_db)):
    """
    Ingestion Pipeline:
    1. Check custom DB-defined LogParsingPipelines (Regex/Grok).
    2. Fallback to hardcoded standard regex (RFC3164).
    3. Fallback to AI inference (LLM) to extract fields.
    """
    
    # 1. Evaluate custom Log Parsing Pipelines from DB
    pipelines = db.query(models.LogParsingPipeline).filter(models.LogParsingPipeline.is_active == True).all()
    for pipe in pipelines:
        try:
            if re.search(pipe.match_condition, log.raw_text):
                match = re.search(pipe.extraction_regex, log.raw_text)
                if match:
                    parsed = match.groupdict()
                    parsed_log = models.NetworkLog(
                        timestamp=parsed.get("ts", datetime.utcnow().isoformat()),
                        source=parsed.get("host", log.source),
                        severity=parsed.get("severity", "info").lower(),
                        facility=parsed.get("facility", "SYS"),
                        message=parsed.get("msg", log.raw_text),
                        raw_log=log.raw_text,
                        enriched_data=parsed
                    )
                    db.add(parsed_log)
                    db.commit()
                    evaluate_log_against_policies(parsed_log, db)
                    return {"status": "ingested_via_custom_pipeline", "parsed": parsed}
        except Exception as e:
            print(f"Pipeline {pipe.name} error: {e}")

    # 2. Hardcoded Standard Regex
    patterns = [
        # Example Syslog RFC3164 (simplified)
        r"^(?P<ts>[A-Z][a-z]{2}\s+\d+\s\d\d:\d\d:\d\d)\s+(?P<host>\S+)\s+(?P<proc>[a-zA-Z0-9_\-]+)(?:\[(?P<pid>\d+)\])?:\s+(?P<msg>.*)$"
    ]
    
    # Example: Cisco Syslog format "%SYS-5-CONFIG_I: Configured from console"
    cisco_pattern = re.compile(r"%([A-Z0-9_]+)-(\d)-([A-Z0-9_]+):\s*(.*)")
    match = cisco_pattern.search(log.raw_text)
    
    if match:
        facility = match.group(1)
        severity_code = match.group(2)
        mnemonic = match.group(3)
        msg = match.group(4)
        
        severity_map = {"0": "critical", "1": "critical", "2": "critical", "3": "error", "4": "warning", "5": "info", "6": "info", "7": "info"}
        severity = severity_map.get(severity_code, "info")
        
        db_log = models.SyslogEvent(
            timestamp=datetime.utcnow(),
            source="NETWORK_DEVICE",
            severity=severity,
            facility=facility,
            msg=f"{mnemonic}: {msg}",
            enriched_data={"parser": "regex_fast_path", "matched_rule": "cisco_syslog"}
        )
        db.add(db_log)
        db.commit()
        evaluate_log_against_policies(db_log, db)
        return {"status": "success", "method": "regex", "log_id": db_log.id}
    
    # 2. AI Fallback Auto-Decoder
    # In production, this makes a request to the local LLM endpoint (e.g. localhost:11434).
    # Here, we simulate the AI analyzing the unstructured string to build a JSON schema.
    print(f"[AI DECODER] Analyzing unknown log format: {raw_text}")
    
    inferred_severity = "info"
    if any(kw in raw_text.upper() for kw in ["EXCEPTION", "ERROR", "FAIL", "FATAL"]):
        inferred_severity = "critical"
    elif any(kw in raw_text.upper() for kw in ["WARN", "TIMEOUT"]):
        inferred_severity = "warning"
        
    inferred_facility = "APP_LOG"
    if "java" in raw_text.lower():
        inferred_facility = "JVM"
    elif "db" in raw_text.lower() or "sql" in raw_text.lower():
        inferred_facility = "DATABASE"

    ai_enriched_payload = {
        "parser": "ai_auto_decoder",
        "ai_confidence": 0.92,
        "extracted_entities": [],
        "raw_dump": raw_text
    }
    
    ips = re.findall(r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b", raw_text)
    if ips:
        ai_enriched_payload["extracted_entities"].append({"type": "ip_addresses", "values": ips})
        
    db_log = models.SyslogEvent(
        timestamp=datetime.utcnow(),
        source="AI_INFERRED_SOURCE",
        severity=inferred_severity,
        facility=inferred_facility,
        msg=raw_text[:100] + ("..." if len(raw_text) > 100 else ""),
        enriched_data=ai_enriched_payload
    )
    db.add(db_log)
    db.commit()
    
    evaluate_log_against_policies(db_log, db)
    return {"status": "success", "method": "ai_auto_decoder", "log_id": db_log.id}

# === Alerting & Connectors Engine ===
class LogAlertPolicyCreate(BaseModel):
    name: str
    query_string: str
    connectors: list
    transform_script: str = None

@app.post("/api/alerts/policies")
def create_alert_policy(policy: LogAlertPolicyCreate, db: Session = Depends(database.get_db)):
    db_policy = models.LogAlertPolicy(
        name=policy.name,
        query_string=policy.query_string,
        connectors=policy.connectors,
        transform_script=policy.transform_script
    )
    db.add(db_policy)
    db.commit()
    db.refresh(db_policy)
    return db_policy

@app.get("/api/alerts/policies")
def get_alert_policies(db: Session = Depends(database.get_db)):
    return db.query(models.LogAlertPolicy).filter(models.LogAlertPolicy.is_active == True).all()

class ConnectorProfileCreate(BaseModel):
    name: str
    connector_type: str
    config_json: dict

@app.post("/api/connectors")
def create_connector_profile(profile: ConnectorProfileCreate, db: Session = Depends(database.get_db)):
    db_profile = models.ConnectorProfile(
        name=profile.name,
        connector_type=profile.connector_type,
        config_json=profile.config_json
    )
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile

@app.get("/api/connectors")
def get_connector_profiles(db: Session = Depends(database.get_db)):
    return db.query(models.ConnectorProfile).filter(models.ConnectorProfile.is_active == True).all()

@app.delete("/api/connectors/{connector_id}")
def delete_connector_profile(connector_id: int, db: Session = Depends(database.get_db)):
    db_profile = db.query(models.ConnectorProfile).filter(models.ConnectorProfile.id == connector_id).first()
    if db_profile:
        db_profile.is_active = False
        db.commit()
    return {"status": "deleted"}

class LogParsingPipelineCreate(BaseModel):
    name: str
    match_condition: str
    extraction_regex: str

@app.post("/api/pipelines")
def create_parsing_pipeline(pipeline: LogParsingPipelineCreate, db: Session = Depends(database.get_db)):
    db_pipeline = models.LogParsingPipeline(
        name=pipeline.name,
        match_condition=pipeline.match_condition,
        extraction_regex=pipeline.extraction_regex
    )
    db.add(db_pipeline)
    db.commit()
    db.refresh(db_pipeline)
    return db_pipeline

@app.get("/api/pipelines")
def get_parsing_pipelines(db: Session = Depends(database.get_db)):
    return db.query(models.LogParsingPipeline).filter(models.LogParsingPipeline.is_active == True).all()

@app.delete("/api/pipelines/{pipeline_id}")
def delete_parsing_pipeline(pipeline_id: int, db: Session = Depends(database.get_db)):
    db_pipeline = db.query(models.LogParsingPipeline).filter(models.LogParsingPipeline.id == pipeline_id).first()
    if db_pipeline:
        db_pipeline.is_active = False
        db.commit()
    return {"status": "deleted"}

# Bulk Save APIs for Settings UI
@app.get("/api/roles")
def get_roles(db: Session = Depends(database.get_db)):
    return db.query(models.Role).all()

@app.post("/api/roles")
def save_roles(roles: list[dict], db: Session = Depends(database.get_db)):
    db.query(models.Role).delete()
    for r in roles:
        db.add(models.Role(name=r['name'], description=r.get('desc',''), users=r.get('users',[]), permissions=r.get('permissions',[])))
    db.commit()
    return {"status": "ok"}

@app.get("/api/snmp_profiles")
def get_snmp_profiles(db: Session = Depends(database.get_db)):
    return db.query(models.SNMPProfile).all()

@app.post("/api/snmp_profiles")
def save_snmp_profiles(profiles: list[dict], db: Session = Depends(database.get_db)):
    db.query(models.SNMPProfile).delete()
    for p in profiles:
        db.add(models.SNMPProfile(
            name=p['name'], version=p['version'], community=p.get('community'), 
            user=p.get('user'), auth_proto=p.get('authProto'), auth_pass=p.get('authPass'),
            priv_proto=p.get('privProto'), priv_pass=p.get('privPass'), port=p.get('port', 161), timeout=p.get('timeout', 2)
        ))
    db.commit()
    return {"status": "ok"}

@app.get("/api/discovery_ranges")
def get_discovery_ranges(db: Session = Depends(database.get_db)):
    return db.query(models.DiscoveryRange).all()

@app.post("/api/discovery_ranges")
def save_discovery_ranges(ranges: list[dict], db: Session = Depends(database.get_db)):
    db.query(models.DiscoveryRange).delete()
    for r in ranges:
        db.add(models.DiscoveryRange(
            label=r.get('label',''), subnet=r.get('subnet',''), profile_name=r.get('profile',''), 
            poll_interval=r.get('poll_interval','60s'), enabled=r.get('enabled',True)
        ))
    db.commit()
    return {"status": "ok"}

class TestQueryPayload(BaseModel):
    query_string: str

@app.post("/api/alerts/test_query")
def test_query(payload: TestQueryPayload, db: Session = Depends(database.get_db)):
    """Live search test for the Alert Builder."""
    logs = db.query(models.SyslogEvent).order_by(models.SyslogEvent.timestamp.desc()).limit(100).all()
    matches = []
    query = payload.query_string.strip()
    if not query:
        return {"matches": []}
        
    parts = query.split()
    for log in logs:
        match = True
        for part in parts:
            if ":" in part:
                k, v = part.split(":", 1)
                val_to_check = None
                if hasattr(log, k):
                    val_to_check = getattr(log, k)
                elif k in log.enriched_data:
                    val_to_check = log.enriched_data[k]
                if val_to_check is None or str(val_to_check).lower() != v.lower():
                    match = False
                    break
            else:
                if part.lower() not in (log.msg or "").lower() and part.lower() not in str(log.enriched_data).lower():
                    match = False
                    break
        if match:
            matches.append({
                "ts": log.timestamp.strftime("%Y-%m-%d %H:%M:%S") if log.timestamp else "",
                "severity": log.severity,
                "source": log.source,
                "facility": log.facility,
                "msg": log.msg,
                "enriched_data": log.enriched_data
            })
    return {"matches": matches[:5]} # Return top 5 matches for UI

class TestWebhookPayload(BaseModel):
    connectors: list
    transform_script: str = None
    mock_log: dict

@app.post("/api/alerts/test_webhook")
def test_webhook(payload: TestWebhookPayload):
    """Simulates payload transformation and webhook firing."""
    results = []
    for connector in payload.connectors:
        final_payload = dict(connector) if isinstance(connector, dict) else {"target": connector}
        script_logs = []
        
        if payload.transform_script:
            try:
                local_vars = {"log": payload.mock_log, "payload": final_payload}
                exec(payload.transform_script, {}, local_vars)
                final_payload = local_vars["payload"]
                script_logs.append("Transformation script executed successfully.")
            except Exception as e:
                script_logs.append(f"Transformation Error: {str(e)}")
                
        results.append({
            "connector": connector.get("type", connector) if isinstance(connector, dict) else connector,
            "final_payload": final_payload,
            "script_logs": script_logs,
            "status": "Simulated Success - HTTP 200"
        })
    return {"results": results}

def evaluate_log_against_policies(db_log: models.SyslogEvent, db: Session):
    policies = db.query(models.LogAlertPolicy).filter(models.LogAlertPolicy.is_active == True).all()
    
    for policy in policies:
        query = policy.query_string.strip()
        if not query:
            continue
            
        parts = query.split()
        match = True
        for part in parts:
            if ":" in part:
                k, v = part.split(":", 1)
                
                val_to_check = None
                if hasattr(db_log, k):
                    val_to_check = getattr(db_log, k)
                elif k in db_log.enriched_data:
                    val_to_check = db_log.enriched_data[k]
                    
                if val_to_check is None or str(val_to_check).lower() != v.lower():
                    match = False
                    break
            else:
                if part.lower() not in (db_log.msg or "").lower() and part.lower() not in str(db_log.enriched_data).lower():
                    match = False
                    break
                    
        if match:
            print(f"[ALERT DISPATCHER] Match found for Policy: '{policy.name}'! Dispatching to {len(policy.connectors)} connectors...")
            for connector in policy.connectors:
                final_payload = dict(connector) if isinstance(connector, dict) else {"target": connector}
                
                if policy.transform_script:
                    try:
                        log_dict = {
                            "source": db_log.source, "severity": db_log.severity, 
                            "facility": db_log.facility, "msg": db_log.msg, "enriched": db_log.enriched_data
                        }
                        local_vars = {"log": log_dict, "payload": final_payload}
                        exec(policy.transform_script, {}, local_vars)
                        final_payload = local_vars["payload"]
                    except Exception as e:
                        print(f"   -> [SCRIPT ERROR] Failed to transform payload: {e}")
                        
                print(f"   -> [REST API] Fired payload: {final_payload}")

@app.post("/api/logs/seed")
def seed_logs(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.require_role("admin"))):
    """Seed the database with sample syslogs if empty"""
    count = db.query(models.SyslogEvent).count()
    if count > 0:
        return {"message": "Database already has logs", "count": count}
    
    sample_logs = [
        { "ts": "2026-06-26 23:42:18", "severity": "critical", "source": "DIST-SW-02", "facility": "SYS", "msg": "Interface GigabitEthernet1/0/1 changed state to down" },
        { "ts": "2026-06-26 23:42:15", "severity": "critical", "source": "DIST-SW-02", "facility": "LINK", "msg": "UPLINK_FAILURE: All uplinks to CORE-RTR-01 are down" },
        { "ts": "2026-06-26 23:41:50", "severity": "warning", "source": "LB-PROD-01", "facility": "LTM", "msg": "Pool member 10.10.20.5:443 monitor status down" },
        { "ts": "2026-06-26 23:40:22", "severity": "warning", "source": "FW-EDGE-01", "facility": "THREAT", "msg": "Spyware detected from 192.168.1.105 to 203.0.113.45" },
        { "ts": "2026-06-26 23:39:10", "severity": "info", "source": "WLC-01", "facility": "DOT11", "msg": "AP AP-F3-WEST associated with controller, slot 0" },
        { "ts": "2026-06-26 23:38:45", "severity": "info", "source": "CORE-RTR-01", "facility": "OSPF", "msg": "OSPF-5-ADJCHG: Neighbor 10.10.0.2 changed to FULL state" },
        { "ts": "2026-06-26 23:37:33", "severity": "warning", "source": "FW-EDGE-01", "facility": "SYSTEM", "msg": "CPU utilization exceeded 70% threshold (current: 72%)" },
        { "ts": "2026-06-26 23:36:01", "severity": "info", "source": "ACC-SW-F1-01", "facility": "AUTH", "msg": "User admin logged in via SSH from 10.10.100.5" },
        { "ts": "2026-06-26 23:34:55", "severity": "info", "source": "CORE-RTR-02", "facility": "BGP", "msg": "BGP-5-ADJCHANGE: neighbor 172.16.0.1 Up" },
        { "ts": "2026-06-26 23:33:20", "severity": "critical", "source": "LB-PROD-01", "facility": "LTM", "msg": "Virtual server /Common/app_https has no available pool members" },
    ]
    
    for log in sample_logs:
        db_log = models.SyslogEvent(
            timestamp=datetime.strptime(log["ts"], "%Y-%m-%d %H:%M:%S"),
            source=log["source"],
            severity=log["severity"],
            facility=log["facility"],
            msg=log["msg"],
            enriched_data={"seeded": True}
        )
        db.add(db_log)
    
    db.commit()
    return {"message": "Sample logs seeded successfully"}
