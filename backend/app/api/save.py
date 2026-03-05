"""
backend/app/api/save.py

POST /api/save/            — save trials and/or physicians to DuckDB
GET  /api/save/history     — list recent save history
GET  /api/save/download    — download the .duckdb file directly
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
from app.db.duckdb_client import save_results, get_duckdb, get_saved_searches, close_connection, DB_PATH

router = APIRouter(prefix="/api/save", tags=["save"])


# ── Request / Response models ─────────────────────────────────────────────────

class SaveRequest(BaseModel):
    save_mode: str                                        # 'all_trials' | 'trials_with_physicians' | 'single_trial'
    trials: List[Dict[str, Any]]                          # trial objects from frontend
    physicians_map: Dict[str, List[Dict[str, Any]]] = {} # { nct_id: [physicians] }
    search_condition: str = ""
    search_filters: Dict[str, Any] = {}                  # { status, phase, city, state }


class SaveResponse(BaseModel):
    success: bool
    save_id: Optional[str] = None
    saved_trials: int = 0
    saved_physicians: int = 0
    save_mode: str = ""
    message: str = ""
    error: Optional[str] = None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/", response_model=SaveResponse)
async def save_to_db(req: SaveRequest):
    """Save trials and optionally physicians to DuckDB."""
    valid_modes = {"all_trials", "trials_with_physicians", "single_trial"}
    if req.save_mode not in valid_modes:
        raise HTTPException(status_code=400, detail=f"Invalid save_mode. Must be one of: {valid_modes}")

    if not req.trials:
        raise HTTPException(status_code=400, detail="No trials provided to save.")

    result = save_results(
        save_mode=req.save_mode,
        trials=req.trials,
        physicians_map=req.physicians_map,
        search_condition=req.search_condition,
        search_filters=req.search_filters,
    )

    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error", "Save failed."))

    mode_labels = {
        "all_trials":             "All trials",
        "trials_with_physicians": "Trials with physicians",
        "single_trial":           "Trial",
    }
    label = mode_labels.get(req.save_mode, "Results")
    msg = f"{label} saved — {result['saved_trials']} trial(s)"
    if result["saved_physicians"] > 0:
        msg += f" + {result['saved_physicians']} physician(s)"

    return SaveResponse(
        success=True,
        save_id=result["save_id"],
        saved_trials=result["saved_trials"],
        saved_physicians=result["saved_physicians"],
        save_mode=req.save_mode,
        message=msg,
    )


@router.get("/history")
async def get_save_history(limit: int = 20):
    """Return recent save actions."""
    conn = get_duckdb()
    try:
        history = get_saved_searches(conn, limit=limit)
        return {"history": history}
    finally:
        close_connection(conn)


@router.get("/download")
async def download_db():
    """
    Download the trialphysician.duckdb file directly from the server.

    After downloading, query it locally with:
        python -c "import duckdb; conn = duckdb.connect('trialphysician.duckdb'); print(conn.execute('SELECT nct_id, title, status FROM trials').fetchall())"
    """
    db_path = os.path.abspath(DB_PATH)

    if not os.path.exists(db_path):
        raise HTTPException(
            status_code=404,
            detail="Database file not found. Save some trials first."
        )

    return FileResponse(
        path=db_path,
        media_type="application/octet-stream",
        filename="trialphysician.duckdb",
        headers={"Content-Disposition": "attachment; filename=trialphysician.duckdb"}
    )


@router.get("/stats")
async def get_db_stats():
    """Quick row counts for all tables — useful for verifying saves without downloading."""
    conn = get_duckdb()
    try:
        trials_count     = conn.execute("SELECT COUNT(*) FROM trials").fetchone()[0]
        physicians_count = conn.execute("SELECT COUNT(*) FROM physicians").fetchone()[0]
        saves_count      = conn.execute("SELECT COUNT(*) FROM saved_searches").fetchone()[0]
        latest = conn.execute(
            "SELECT nct_id, title, search_condition, created_at FROM trials ORDER BY created_at DESC LIMIT 3"
        ).fetchall()
        return {
            "counts": {
                "trials":      trials_count,
                "physicians":  physicians_count,
                "saved_searches": saves_count,
            },
            "latest_trials": [
                {"nct_id": r[0], "title": r[1], "search_condition": r[2], "saved_at": str(r[3])}
                for r in latest
            ]
        }
    finally:
        close_connection(conn)