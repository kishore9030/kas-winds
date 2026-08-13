import os
import subprocess
import platform
import asyncio
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from pysnmp.hlapi.asyncio import *

from . import models, database

def ping_node(ip_address: str) -> bool:
    """
    Sends a single ICMP echo request to the target IP.
    Returns True if reachable, False otherwise.
    """
    param = '-n' if platform.system().lower() == 'windows' else '-c'
    command = ['ping', param, '1', ip_address]
    
    try:
        # We suppress output
        with open(os.devnull, 'w') as devnull:
            result = subprocess.run(command, stdout=devnull, stderr=devnull, timeout=2)
            return result.returncode == 0
    except subprocess.TimeoutExpired:
        return False
    except Exception:
        return False

async def snmp_get_sysname(ip_address: str, community: str = 'public') -> str:
    """
    Asynchronously fetches the sysName (1.3.6.1.2.1.1.5.0) via SNMP v2c.
    """
    snmpEngine = SnmpEngine()
    errorIndication, errorStatus, errorIndex, varBinds = await getCmd(
        snmpEngine,
        CommunityData(community, mpModel=1), # mpModel=1 for v2c
        UdpTransportTarget((ip_address, 161), timeout=1.0, retries=1),
        ContextData(),
        ObjectType(ObjectIdentity('SNMPv2-MIB', 'sysName', 0))
    )

    if errorIndication:
        # print(f"[{ip_address}] SNMP Error: {errorIndication}")
        return None
    elif errorStatus:
        return None
    else:
        for varBind in varBinds:
            return varBind[1].prettyPrint()
    return None

async def poll_node(db: Session, node: models.NetworkNode):
    """
    Polls a single node: 
    1. Ping for reachability.
    2. If reachable, fetch SNMP sysName.
    3. Update database status.
    """
    is_up = ping_node(node.ip_address)
    new_status = "up" if is_up else "down"
    
    if is_up:
        sysname = await snmp_get_sysname(node.ip_address, node.snmp_community)
        if sysname:
            node.hostname = sysname # Update dynamically discovered hostname

    node.status = new_status
    import datetime
    node.last_polled_at = datetime.datetime.utcnow()
    
    db.commit()
    return {"ip": node.ip_address, "status": new_status, "hostname": node.hostname}

async def run_polling_cycle():
    """
    Fetches all nodes from DB and polls them.
    In a real system, this would be a Celery task or an independent worker loop.
    """
    db = database.SessionLocal()
    try:
        nodes = db.query(models.NetworkNode).all()
        tasks = [poll_node(db, node) for node in nodes]
        results = await asyncio.gather(*tasks)
        print(f"Polled {len(results)} nodes.")
        return results
    finally:
        db.close()

if __name__ == "__main__":
    # Test run
    asyncio.run(run_polling_cycle())
