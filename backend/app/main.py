from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import os

load_dotenv()

from app.api import trials, physicians

app = FastAPI(title="TrialPhysician Finder API")

# ── CORS origin resolution ────────────────────────────────────────────────────
# Set ALLOWED_ORIGINS in Render's environment variables as a comma-separated
# list, e.g: https://your-app.vercel.app,http://localhost:3000
# If not set, all *.vercel.app preview URLs + localhost are allowed by default.
_raw = os.getenv("ALLOWED_ORIGINS", "")
ALLOWED_ORIGINS = [o.strip() for o in _raw.split(",") if o.strip()]

def _is_origin_allowed(origin: str) -> bool:
    if not origin:
        return False
    # Explicit list match
    if origin in ALLOWED_ORIGINS:
        return True
    # Always allow any Vercel preview deployment (*.vercel.app)
    if origin.endswith(".vercel.app"):
        return True
    # Always allow local development
    if origin.startswith("http://localhost") or origin.startswith("http://127.0.0.1"):
        return True
    return False

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS or ["*"],
    allow_credentials=bool(ALLOWED_ORIGINS),  # credentials only work with explicit origins
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Manual OPTIONS + header injection middleware.
# Render's proxy can silently drop CORS headers on preflight requests,
# so we intercept every request and stamp the correct headers ourselves.
@app.middleware("http")
async def cors_middleware(request: Request, call_next):
    origin = request.headers.get("origin", "")
    allowed = _is_origin_allowed(origin)

    # Respond to preflight immediately
    if request.method == "OPTIONS" and allowed:
        return JSONResponse(
            content={},
            status_code=200,
            headers={
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Max-Age": "86400",
            },
        )

    response = await call_next(request)

    # Stamp CORS headers on every response so Render can't strip them
    if allowed:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"

    return response

app.include_router(trials.router, prefix="/api/trials", tags=["Trials"])
app.include_router(physicians.router, prefix="/api/physicians", tags=["Physicians"])