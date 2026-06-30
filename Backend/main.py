"""
main.py — FastAPI entry point
Run: uvicorn main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from db import init_db
import complaints
import messages
import intelligence

app = FastAPI(
    title="SevaAI API",
    description="AI-powered civic complaint platform",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten to your Vercel URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    init_db()

app.include_router(complaints.router)
app.include_router(messages.router)
app.include_router(intelligence.router)

@app.get("/")
async def root():
    return {"status": "SevaAI API running", "docs": "/docs"}
