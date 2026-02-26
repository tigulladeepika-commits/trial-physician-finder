import duckdb

def get_duckdb():
    conn = duckdb.connect('trialphysician.duckdb')
    conn.execute("""
    CREATE TABLE IF NOT EXISTS trials (
        nct_id TEXT,
        title TEXT,
        status TEXT,
        phase TEXT,
        sponsor TEXT,
        locations TEXT
    )
    """)
    return conn