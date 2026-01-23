"""
HelioMetric FastAPI Backend
Serves both API endpoints and the React/Vite static frontend
"""

import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from routers import noaa, location, geocode


# Path to the frontend build directory
FRONTEND_DIR = Path(__file__).parent.parent / "frontend" / "dist"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    print("HelioMetric starting...")
    print(f"Frontend directory: {FRONTEND_DIR}")
    print(f"Frontend exists: {FRONTEND_DIR.exists()}")
    yield
    print("HelioMetric shutting down...")


app = FastAPI(
    title="HelioMetric",
    description="Heliospheric Resonance Dashboard",
    version="0.3.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS configuration (mainly for local development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(noaa.router, prefix="/api", tags=["NOAA"])
app.include_router(location.router, prefix="/api", tags=["Location"])
app.include_router(geocode.router, prefix="/api", tags=["Geocode"])


@app.get("/health")
async def health_check():
    """Health check endpoint for Render and monitoring"""
    return {
        "status": "healthy",
        "service": "HelioMetric",
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
            {"path": "/health", "method": "GET", "description": "Health check endpoint"},
        ],
        "docs": "/api/docs"
    }


# Mount static files if frontend is built
if FRONTEND_DIR.exists():
    # Serve static assets (js, css, images, etc.)
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIR / "assets"), name="assets")

    # Serve other static files from root
    @app.get("/vite.svg")
    async def vite_svg():
        return FileResponse(FRONTEND_DIR / "vite.svg")


# Catch-all route for SPA - must be last
@app.get("/{full_path:path}")
async def serve_spa(request: Request, full_path: str):
    """Serve the React SPA for all non-API routes"""
    # Don't serve index.html for API routes
    if full_path.startswith("api"):
        from fastapi.responses import JSONResponse
        return JSONResponse({"error": "Not found"}, status_code=404)

    # Check if it's a static file that exists
    file_path = FRONTEND_DIR / full_path
    if file_path.exists() and file_path.is_file():
        return FileResponse(file_path)

    # Serve index.html for all other routes (SPA routing)
    index_path = FRONTEND_DIR / "index.html"
    if index_path.exists():
        return FileResponse(index_path)

    # Fallback if frontend not built
    return {
        "status": "healthy",
        "service": "HelioMetric API",
        "version": "0.3.0",
        "message": "Frontend not built. Run 'yarn build' in frontend directory.",
        "api_docs": "/api/docs"
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
