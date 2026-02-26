from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from app.api import trials, physicians

app = FastAPI(title="TrialPhysician Finder API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,   # must be False when using wildcard
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(trials.router, prefix="/api/trials", tags=["Trials"])
app.include_router(physicians.router, prefix="/api/physicians", tags=["Physicians"])
