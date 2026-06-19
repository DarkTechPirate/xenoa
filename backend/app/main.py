from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any

app = FastAPI(
    title="TransactIQ API",
    description="Enterprise Transaction Validation & Data Quality Intelligence Platform",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "TransactIQ backend is running."}

# Include routers here later
from app.api import upload
app.include_router(upload.router, prefix="/api", tags=["API"])
