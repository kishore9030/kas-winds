from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="viewer") # e.g., admin, noc_engineer, viewer
    is_active = Column(Boolean, default=True)

class NetworkNode(Base):
    __tablename__ = "network_nodes"

    id = Column(Integer, primary_key=True, index=True)
    hostname = Column(String, index=True)
    ip_address = Column(String, unique=True, index=True)
    vendor = Column(String)
    model = Column(String)
    snmp_community = Column(String, default="public")
    snmp_version = Column(String, default="v2c")
    status = Column(String, default="unknown")
    last_polled_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    interfaces = relationship("NetworkInterface", back_populates="node", cascade="all, delete-orphan")

class NetworkInterface(Base):
    __tablename__ = "network_interfaces"

    id = Column(Integer, primary_key=True, index=True)
    node_id = Column(Integer, ForeignKey("network_nodes.id"))
    if_index = Column(Integer, index=True)
    if_name = Column(String, index=True)
    if_desc = Column(String)
    if_type = Column(Integer)
    if_speed = Column(Integer)
    if_admin_status = Column(Integer)
    if_oper_status = Column(Integer)
    last_polled_at = Column(DateTime, default=datetime.utcnow)

    node = relationship("NetworkNode", back_populates="interfaces")

class SyslogEvent(Base):
    __tablename__ = "syslog_events"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    source = Column(String, index=True)
    severity = Column(String, index=True)
    facility = Column(String)
    msg = Column(String)
    enriched_data = Column(JSON, default=dict) # Allows dynamic JSON enrichment

class LogAlertPolicy(Base):
    __tablename__ = "log_alert_policies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    query_string = Column(String)
    connectors = Column(JSON, default=list) # e.g. ["msteams", "jira", "smax"]
    transform_script = Column(String, nullable=True) # Custom python script to mutate payload
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ConnectorProfile(Base):
    __tablename__ = "connector_profiles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    connector_type = Column(String) # e.g. "keephq", "msteams"
    config_json = Column(JSON, default=dict) # The actual payload/auth config
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class LogParsingPipeline(Base):
    __tablename__ = "log_parsing_pipelines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    match_condition = Column(String) # e.g. Regex to match the raw log line
    extraction_regex = Column(String) # e.g. (?P<severity>\w+)\s+(?P<message>.*)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    users = Column(JSON, default=list)
    permissions = Column(JSON, default=list)

class SNMPProfile(Base):
    __tablename__ = "snmp_profiles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    version = Column(String) # v1, v2c, v3 (noAuthNoPriv), etc.
    community = Column(String, nullable=True)
    user = Column(String, nullable=True)
    auth_proto = Column(String, nullable=True)
    auth_pass = Column(String, nullable=True)
    priv_proto = Column(String, nullable=True)
    priv_pass = Column(String, nullable=True)
    port = Column(Integer, default=161)
    timeout = Column(Integer, default=2)

class DiscoveryRange(Base):
    __tablename__ = "discovery_ranges"
    id = Column(Integer, primary_key=True, index=True)
    label = Column(String)
    subnet = Column(String) # CIDR
    profile_name = Column(String) # Links to SNMPProfile.name for simplicity
    poll_interval = Column(String) # e.g. "60s"
    enabled = Column(Boolean, default=True)
