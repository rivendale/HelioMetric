"""
HelioMetric FastAPI Backend
Provides API endpoints for NOAA data, geocoding, and location analysis
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import noaa, location, geocode


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    print("HelioMetric API starting...")
    yield
    print("HelioMetric API shutting down...")


app = FastAPI(
    title="HelioMetric API",
    description="Heliospheric Resonance Dashboard Backend",
    version="0.3.0",
    lifespan=lifespan
)

# CORS configuration for Vite frontend
frontend_origins = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:4173",  # Vite preview
    "http://127.0.0.1:5173",
    "http://127.0.0.1:4173",
]

# Add production frontend URL if set
if os.getenv("FRONTEND_URL"):
    frontend_origins.append(os.getenv("FRONTEND_URL"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(noaa.router, prefix="/api", tags=["NOAA"])
app.include_router(location.router, prefix="/api", tags=["Location"])
app.include_router(geocode.router, prefix="/api", tags=["Geocode"])


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "HelioMetric API",
        "version": "0.3.0"
    }


@app.get("/api")
async def api_info():
    """API information endpoint"""
    return {
        "endpoints": [
            {"path": "/api/noaa", "method": "GET", "description": "Get NOAA K-Index data"},
            {"path": "/api/location", "method": "POST", "description": "Analyze geomagnetic impact for coordinates"},
            {"path": "/api/geocode", "method": "POST", "description": "Convert address to coordinates"},
        ]
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=os.getenv("NODE_ENV") != "production"
    )
