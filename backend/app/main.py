from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from app.api import trials, physicians

app = FastAPI(title="TrialPhysician Finder API")

# Allow all origins — works for any Vercel preview URL without hardcoding.
# allow_credentials must be False when using wildcard "*".
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(trials.router, prefix="/api/trials", tags=["Trials"])
app.include_router(physicians.router, prefix="/api/physicians", tags=["Physicians"])


@app.get("/")
async def root():
    return {"status": "ok", "message": "TrialPhysician Finder API is running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}