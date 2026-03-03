from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(title="TrialPhysician Finder API")

# ── CORS must be registered BEFORE any routers or other middleware ────────────

def _is_origin_allowed(origin: str) -> bool:
    if not origin:
        return False
    if origin.endswith(".vercel.app"):
        return True
    if origin.startswith("http://localhost") or origin.startswith("http://127.0.0.1"):
        return True
    extra = os.getenv("ALLOWED_ORIGINS", "")
    if origin in [o.strip() for o in extra.split(",") if o.strip()]:
        return True
    return False


@app.middleware("http")
async def cors_middleware(request: Request, call_next):
    origin = request.headers.get("origin", "")
    allowed = _is_origin_allowed(origin)

    # Handle preflight OPTIONS immediately — never forward to routers
    if request.method == "OPTIONS":
        return JSONResponse(
            content="OK",
            status_code=200,
            headers={
                "Access-Control-Allow-Origin": origin if allowed else "",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Max-Age": "86400",
            },
        )

    response = await call_next(request)

    if allowed:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Vary"] = "Origin"

    return response


# Routers registered AFTER middleware
from app.api import trials, physicians
app.include_router(trials.router, prefix="/api/trials", tags=["Trials"])
app.include_router(physicians.router, prefix="/api/physicians", tags=["Physicians"])