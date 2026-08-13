import json
from sqlalchemy import Table, Column, Integer, String, Boolean, Float, MetaData, inspect
from typing import List, Dict, Any
from .database import engine

metadata = MetaData()

def infer_sqlalchemy_type(value: Any):
    """Infers the SQLAlchemy column type from a python value."""
    if isinstance(value, bool):
        return Boolean
    elif isinstance(value, int):
        return Integer
    elif isinstance(value, float):
        return Float
    else:
        # Default to String for anything else (dict, list, string)
        return String

def auto_generate_table(table_name: str, payload: List[Dict[str, Any]]) -> Table:
    """
    Dynamically generates a SQLAlchemy Table schema based on the first item in the payload array.
    If the table doesn't exist in the database, it executes DDL to create it.
    """
    if not payload or not isinstance(payload, list):
        raise ValueError("Payload must be a non-empty list of dictionaries.")

    sample_record = payload[0]
    
    columns = [
        Column("id", Integer, primary_key=True, autoincrement=True)
    ]

    for key, value in sample_record.items():
        if key == "id": # skip if payload has 'id' to avoid primary key conflict
            continue
        col_type = infer_sqlalchemy_type(value)
        columns.append(Column(key, col_type))

    # Define the table dynamically
    # Use extend_existing=True in case we call this multiple times in the same process
    dynamic_table = Table(
        table_name,
        metadata,
        *columns,
        extend_existing=True
    )

    # Inspect the DB to see if table exists
    inspector = inspect(engine)
    if not inspector.has_table(table_name):
        print(f"[DB ENGINE] Creating new dynamic table: {table_name}")
        dynamic_table.create(engine)
    else:
        # In a fully advanced scenario, we would use Alembic to add new columns here.
        # For now, we assume the schema is defined by the first payload connection.
        print(f"[DB ENGINE] Table {table_name} already exists.")

    return dynamic_table

def insert_dynamic_records(table_name: str, payload: List[Dict[str, Any]]):
    """
    Auto-generates the table if needed, then inserts all records from the payload.
    """
    dynamic_table = auto_generate_table(table_name, payload)
    
    with engine.begin() as conn:
        # For simplicity, we just insert. 
        # In production we might use upserts or clear the table first depending on connector logic.
        conn.execute(dynamic_table.insert(), payload)
        print(f"[DB ENGINE] Inserted {len(payload)} records into {table_name}.")

    return {"status": "success", "table": table_name, "records_inserted": len(payload)}
