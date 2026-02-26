from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables from backend/.env
load_dotenv()

from app.api import trials, physicians

app = FastAPI(title="TrialPhysician Finder API")

# CORS setup for Vercel frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://trial-physician-finder-mp9h-avdx8xda.vercel.app",
        "http://localhost:3000",],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(trials.router, prefix="/api/trials", tags=["Trials"])
app.include_router(physicians.router, prefix="/api/physicians", tags=["Physicians"])