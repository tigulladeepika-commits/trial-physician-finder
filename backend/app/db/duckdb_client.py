import duckdb
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

DB_PATH = 'trialphysician.duckdb'


def get_duckdb():
    """Get database connection with proper schema"""
    conn = duckdb.connect(DB_PATH)
    
    # Create trials table with complete schema
    conn.execute("""
    CREATE TABLE IF NOT EXISTS trials (
        nct_id TEXT PRIMARY KEY,
        title TEXT,
        status TEXT,
        phase TEXT,
        sponsor TEXT,
        conditions TEXT,
        locations TEXT,
        inclusion_criteria TEXT,
        exclusion_criteria TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Create indexes for faster filtering
    conn.execute("""
    CREATE INDEX IF NOT EXISTS idx_status ON trials(status)
    """)
    conn.execute("""
    CREATE INDEX IF NOT EXISTS idx_phase ON trials(phase)
    """)
    conn.execute("""
    CREATE INDEX IF NOT EXISTS idx_conditions ON trials(conditions)
    """)
    
    return conn


def insert_trials(conn, trials: List[Dict[str, Any]]) -> int:
    """Insert trials into DuckDB"""
    count = 0
    for trial in trials:
        try:
            conn.execute("""
            INSERT OR REPLACE INTO trials (
                nct_id, title, status, phase, sponsor, 
                conditions, locations, inclusion_criteria, 
                exclusion_criteria, description, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                trial.get('nctId'),
                trial.get('title'),
                trial.get('status'),
                trial.get('phases', [])[0] if trial.get('phases') else None,
                trial.get('sponsor'),
                json.dumps(trial.get('conditions', [])),
                json.dumps(trial.get('locations', [])),
                trial.get('inclusionCriteria'),
                trial.get('exclusionCriteria'),
                trial.get('description'),
                datetime.now().isoformat()
            ))
            count += 1
        except Exception as e:
            logger.error(f"Error inserting trial {trial.get('nctId')}: {e}")
    return count


def get_trials_by_condition(
    conn, 
    condition: str, 
    status: str = "", 
    phase: str = "",
    location: str = "",
    limit: int = 20,
    offset: int = 0
) -> List[Dict]:
    """Query trials from DuckDB with filters"""
    query = "SELECT * FROM trials WHERE 1=1"
    params = []
    
    if condition:
        query += " AND conditions LIKE ?"
        params.append(f"%{condition}%")
    
    if status:
        query += " AND status = ?"
        params.append(status)
    
    if phase:
        query += " AND phase = ?"
        params.append(phase)
    
    if location:
        query += " AND locations LIKE ?"
        params.append(f"%{location}%")
    
    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    
    results = conn.execute(query, params).fetchall()
    columns = [col[0] for col in conn.description]
    
    return [dict(zip(columns, row)) for row in results]


def get_trial_count(conn, condition: str = "", status: str = "", phase: str = "") -> int:
    """Get total count of trials matching filters"""
    query = "SELECT COUNT(*) FROM trials WHERE 1=1"
    params = []
    
    if condition:
        query += " AND conditions LIKE ?"
        params.append(f"%{condition}%")
    
    if status:
        query += " AND status = ?"
        params.append(status)
    
    if phase:
        query += " AND phase = ?"
        params.append(phase)
    
    result = conn.execute(query, params).fetchone()
    return result[0] if result else 0


def sync_trials_from_api(conn, trials: List[Dict[str, Any]]) -> int:
    """Sync trials from API to DuckDB"""
    count = insert_trials(conn, trials)
    conn.commit()
    logger.info(f"Synced {count} trials to DuckDB")
    return count


def close_connection(conn):
    """Close database connection"""
    conn.close()