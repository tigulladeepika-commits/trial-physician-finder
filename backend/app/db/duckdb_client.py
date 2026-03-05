import duckdb
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

DB_PATH = 'trialphysician.duckdb'


def get_duckdb():
    """Get database connection with complete schema for trials + physicians."""
    conn = duckdb.connect(DB_PATH)

    # ── Trials table ──────────────────────────────────────────────────────────
    conn.execute("""
    CREATE TABLE IF NOT EXISTS trials (
        nct_id              TEXT PRIMARY KEY,
        title               TEXT,
        status              TEXT,
        phase               TEXT,
        sponsor             TEXT,
        conditions          TEXT,   -- JSON array
        locations           TEXT,   -- JSON array
        inclusion_criteria  TEXT,
        exclusion_criteria  TEXT,
        description         TEXT,
        saved_with_physicians BOOLEAN DEFAULT FALSE,
        search_condition    TEXT,   -- what the user searched when saving
        created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # ── Physicians table ──────────────────────────────────────────────────────
    # Linked to trials via nct_id so we know which trial each physician was
    # found for. One physician can appear under multiple trials.
    conn.execute("""
    CREATE TABLE IF NOT EXISTS physicians (
        id              TEXT PRIMARY KEY,  -- npi + "_" + nct_id
        npi             TEXT NOT NULL,
        nct_id          TEXT NOT NULL,     -- FK → trials.nct_id
        name            TEXT,
        specialty       TEXT,
        taxonomy_code   TEXT,
        taxonomy_desc   TEXT,
        city            TEXT,
        state           TEXT,
        phone           TEXT,
        address         TEXT,
        created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # ── Saved searches table ──────────────────────────────────────────────────
    # Records each save action so users can see their history
    conn.execute("""
    CREATE TABLE IF NOT EXISTS saved_searches (
        id              TEXT PRIMARY KEY,  -- uuid
        save_mode       TEXT,              -- 'all_trials' | 'trials_with_physicians' | 'single_trial'
        search_condition TEXT,
        search_filters  TEXT,             -- JSON: status, phase, city, state
        trial_count     INTEGER,
        physician_count INTEGER,
        saved_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # ── Indexes ───────────────────────────────────────────────────────────────
    conn.execute("CREATE INDEX IF NOT EXISTS idx_trials_status     ON trials(status)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_trials_phase      ON trials(phase)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_trials_conditions ON trials(conditions)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_physicians_nct    ON physicians(nct_id)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_physicians_npi    ON physicians(npi)")

    return conn


# ── Trial helpers ─────────────────────────────────────────────────────────────

def insert_trials(
    conn,
    trials: List[Dict[str, Any]],
    search_condition: str = "",
    with_physicians: bool = False,
) -> int:
    """Upsert trials into DuckDB. Returns count of rows inserted/updated."""
    count = 0
    for trial in trials:
        try:
            conn.execute("""
            INSERT INTO trials (
                nct_id, title, status, phase, sponsor,
                conditions, locations, inclusion_criteria,
                exclusion_criteria, description,
                saved_with_physicians, search_condition, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (nct_id) DO UPDATE SET
                title               = excluded.title,
                status              = excluded.status,
                phase               = excluded.phase,
                sponsor             = excluded.sponsor,
                conditions          = excluded.conditions,
                locations           = excluded.locations,
                inclusion_criteria  = excluded.inclusion_criteria,
                exclusion_criteria  = excluded.exclusion_criteria,
                description         = excluded.description,
                saved_with_physicians = excluded.saved_with_physicians,
                search_condition    = excluded.search_condition,
                updated_at          = excluded.updated_at
            """, (
                trial.get('nctId'),
                trial.get('title'),
                trial.get('status'),
                trial.get('phases', [])[0] if trial.get('phases') else None,
                trial.get('sponsor'),
                json.dumps(trial.get('conditions', [])),
                json.dumps(trial.get('locations',  [])),
                trial.get('inclusionCriteria'),
                trial.get('exclusionCriteria'),
                trial.get('description'),
                with_physicians,
                search_condition,
                datetime.now().isoformat(),
            ))
            count += 1
        except Exception as e:
            logger.error(f"Error inserting trial {trial.get('nctId')}: {e}")
    return count


def insert_physicians(
    conn,
    physicians: List[Dict[str, Any]],
    nct_id: str,
) -> int:
    """Upsert physicians linked to a specific trial. Returns count."""
    count = 0
    for doc in physicians:
        npi = doc.get('npi', '')
        if not npi:
            continue
        pk = f"{npi}_{nct_id}"
        try:
            conn.execute("""
            INSERT INTO physicians (
                id, npi, nct_id, name, specialty,
                taxonomy_code, taxonomy_desc,
                city, state, phone, address, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (id) DO UPDATE SET
                name          = excluded.name,
                specialty     = excluded.specialty,
                taxonomy_code = excluded.taxonomy_code,
                taxonomy_desc = excluded.taxonomy_desc,
                city          = excluded.city,
                state         = excluded.state,
                phone         = excluded.phone,
                address       = excluded.address
            """, (
                pk, npi, nct_id,
                doc.get('name'),
                doc.get('specialty'),
                doc.get('taxonomyCode'),
                doc.get('taxonomyDescription'),
                doc.get('city'),
                doc.get('state'),
                doc.get('phone'),
                doc.get('address'),
                datetime.now().isoformat(),
            ))
            count += 1
        except Exception as e:
            logger.error(f"Error inserting physician {npi}: {e}")
    return count


def record_saved_search(
    conn,
    save_mode: str,
    search_condition: str,
    search_filters: Dict,
    trial_count: int,
    physician_count: int,
) -> str:
    """Record a save action in saved_searches. Returns the generated ID."""
    import uuid
    save_id = str(uuid.uuid4())
    conn.execute("""
    INSERT INTO saved_searches
        (id, save_mode, search_condition, search_filters, trial_count, physician_count, saved_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        save_id, save_mode, search_condition,
        json.dumps(search_filters),
        trial_count, physician_count,
        datetime.now().isoformat(),
    ))
    return save_id


# ── Main save entry point ─────────────────────────────────────────────────────

def save_results(
    save_mode: str,              # 'all_trials' | 'trials_with_physicians' | 'single_trial'
    trials: List[Dict],
    physicians_map: Dict[str, List[Dict]],  # { nct_id: [physicians] }
    search_condition: str = "",
    search_filters: Dict = {},
) -> Dict[str, Any]:
    """
    Master save function. Handles all 3 save modes:

    - 'all_trials'              : save every trial in the current results page
    - 'trials_with_physicians'  : save only trials that have physicians attached
    - 'single_trial'            : save one specific trial (trials list has 1 item)

    physicians_map is { nct_id: [physician dicts] } — only populated when the
    user has clicked "Find Physicians" for that trial.
    """
    conn = get_duckdb()
    total_trials = 0
    total_physicians = 0

    try:
        if save_mode == 'all_trials':
            # Save every trial; attach any physicians that happen to be loaded
            total_trials = insert_trials(
                conn, trials, search_condition, with_physicians=False
            )
            for trial in trials:
                nct_id = trial.get('nctId', '')
                docs = physicians_map.get(nct_id, [])
                if docs:
                    total_physicians += insert_physicians(conn, docs, nct_id)

        elif save_mode == 'trials_with_physicians':
            # Only save trials that have physicians loaded
            trials_with_docs = [
                t for t in trials
                if physicians_map.get(t.get('nctId', ''))
            ]
            total_trials = insert_trials(
                conn, trials_with_docs, search_condition, with_physicians=True
            )
            for trial in trials_with_docs:
                nct_id = trial.get('nctId', '')
                docs = physicians_map.get(nct_id, [])
                total_physicians += insert_physicians(conn, docs, nct_id)

        elif save_mode == 'single_trial':
            # trials list contains exactly 1 trial
            total_trials = insert_trials(
                conn, trials, search_condition, with_physicians=bool(physicians_map)
            )
            if trials:
                nct_id = trials[0].get('nctId', '')
                docs = physicians_map.get(nct_id, [])
                if docs:
                    total_physicians += insert_physicians(conn, docs, nct_id)

        # Record the save action
        save_id = record_saved_search(
            conn, save_mode, search_condition, search_filters,
            total_trials, total_physicians
        )
        conn.commit()

        return {
            "success": True,
            "save_id": save_id,
            "saved_trials": total_trials,
            "saved_physicians": total_physicians,
            "save_mode": save_mode,
        }

    except Exception as e:
        logger.error(f"save_results failed: {e}")
        return {"success": False, "error": str(e)}
    finally:
        conn.close()


# ── Query helpers (unchanged from original + new ones) ────────────────────────

def get_trials_by_condition(
    conn,
    condition: str,
    status: str = "",
    phase: str = "",
    location: str = "",
    limit: int = 20,
    offset: int = 0,
) -> List[Dict]:
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


def get_physicians_for_trial(conn, nct_id: str) -> List[Dict]:
    """Retrieve all saved physicians linked to a trial."""
    results = conn.execute(
        "SELECT * FROM physicians WHERE nct_id = ? ORDER BY name",
        [nct_id]
    ).fetchall()
    columns = [col[0] for col in conn.description]
    return [dict(zip(columns, row)) for row in results]


def get_saved_searches(conn, limit: int = 20) -> List[Dict]:
    """List recent save actions."""
    results = conn.execute(
        "SELECT * FROM saved_searches ORDER BY saved_at DESC LIMIT ?",
        [limit]
    ).fetchall()
    columns = [col[0] for col in conn.description]
    return [dict(zip(columns, row)) for row in results]


def get_trial_count(conn, condition: str = "", status: str = "", phase: str = "") -> int:
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
    """Legacy helper — kept for backwards compatibility."""
    count = insert_trials(conn, trials)
    conn.commit()
    logger.info(f"Synced {count} trials to DuckDB")
    return count


def close_connection(conn):
    conn.close()