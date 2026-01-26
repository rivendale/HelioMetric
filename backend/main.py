"""
HelioMetric FastAPI Backend
Serves both API endpoints and the React/Vite static frontend

Security Features:
- CORS configuration with environment-aware origins
- Security headers middleware
- Standardized API responses with dual-case field names
"""

import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from routers import noaa, location, geocode
from utils.responses import success_response, error_response, ErrorCodes


# ============================================================================
# Configuration
# ============================================================================

# Path to the frontend build directory
FRONTEND_DIR = Path(__file__).parent.parent / "frontend" / "dist"

# Application version
APP_VERSION = "0.4.0"

# Environment detection
IS_PRODUCTION = os.getenv("NODE_ENV") == "production"

# Allowed origins for CORS
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8000",
]

# Add production origins if configured
PRODUCTION_ORIGIN = os.getenv("PRODUCTION_ORIGIN")
if PRODUCTION_ORIGIN:
    CORS_ORIGINS.append(PRODUCTION_ORIGIN)

# In production without explicit origins, use wildcard (for initial deployment)
# NOTE: For better security, configure PRODUCTION_ORIGIN environment variable
if IS_PRODUCTION and not PRODUCTION_ORIGIN:
    CORS_ORIGINS = ["*"]


# ============================================================================
# Security Middleware
# ============================================================================

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses"""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Cache control for API responses
        if request.url.path.startswith("/api"):
            # Don't cache API responses by default
            if "Cache-Control" not in response.headers:
                response.headers["Cache-Control"] = "no-store, max-age=0"

        return response


# ============================================================================
# Application Setup
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    print(f"HelioMetric v{APP_VERSION} starting...")
    print(f"Environment: {'production' if IS_PRODUCTION else 'development'}")
    print(f"Frontend directory: {FRONTEND_DIR}")
    print(f"Frontend exists: {FRONTEND_DIR.exists()}")
    yield
    print("HelioMetric shutting down...")


app = FastAPI(
    title="HelioMetric",
    description="Heliospheric Resonance Dashboard - Space weather and geomagnetic analysis API",
    version=APP_VERSION,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Add security headers middleware
app.add_middleware(SecurityHeadersMiddleware)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
    expose_headers=["X-Request-ID"],
    max_age=86400,  # Cache preflight for 24 hours
)

# Include API routers
app.include_router(noaa.router, prefix="/api", tags=["NOAA"])
app.include_router(location.router, prefix="/api", tags=["Location"])
app.include_router(geocode.router, prefix="/api", tags=["Geocode"])


@app.get("/health")
async def health_check():
    """
    Health check endpoint for Render and monitoring.

    Returns service status, version, and basic system information.
    Used by deployment platforms for health monitoring.
    """
    return success_response(
        data={
            "status": "healthy",
            "service": "HelioMetric",
            "version": APP_VERSION,
            "environment": "production" if IS_PRODUCTION else "development",
        },
        source="system"
    )


@app.get("/api")
async def api_info():
    """
    API information and documentation endpoint.

    Returns a list of available endpoints with descriptions
    and links to API documentation.
    """
    return success_response(
        data={
            "name": "HelioMetric API",
            "version": APP_VERSION,
            "description": "Space weather and geomagnetic analysis API",
            "response_format": {
                "note": "All responses include both snake_case and camelCase field names",
                "structure": {
                    "success": "boolean",
                    "data": "response payload",
                    "meta": "metadata (timestamp, cached, source)",
                    "error": "error details (when success=false)"
                }
            },
            "endpoints": [
                {
                    "path": "/api/noaa",
                    "method": "GET",
                    "description": "Get NOAA K-Index space weather data"
                },
                {
                    "path": "/api/noaa/description/{kp_value}",
                    "method": "GET",
                    "description": "Get description for specific K-Index value"
                },
                {
                    "path": "/api/location",
                    "method": "POST",
                    "description": "Analyze geomagnetic impact for coordinates"
                },
                {
                    "path": "/api/geocode",
                    "method": "POST",
                    "description": "Convert address to coordinates"
                },
                {
                    "path": "/health",
                    "method": "GET",
                    "description": "Service health check"
                },
            ],
            "documentation": {
                "swagger": "/api/docs",
                "redoc": "/api/redoc",
                "openapi": "/api/openapi.json"
            }
        },
        source="documentation"
    )


# Mount static files if frontend is built
if FRONTEND_DIR.exists():
    # Serve static assets (js, css, images, etc.)
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIR / "assets"), name="assets")

    # Serve other static files from root
    @app.get("/vite.svg")
    async def vite_svg():
        return FileResponse(FRONTEND_DIR / "vite.svg")


# ============================================================================
# Error Handlers
# ============================================================================

@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    """Handle 404 errors with standardized response"""
    if request.url.path.startswith("/api"):
        return JSONResponse(
            status_code=404,
            content=error_response(
                code=ErrorCodes.NOT_FOUND,
                message=f"Endpoint not found: {request.url.path}",
                status_code=404
            )
        )
    # For non-API routes, let SPA handle it
    index_path = FRONTEND_DIR / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    return JSONResponse(
        status_code=404,
        content=error_response(
            code=ErrorCodes.NOT_FOUND,
            message="Resource not found",
            status_code=404
        )
    )


@app.exception_handler(500)
async def internal_error_handler(request: Request, exc):
    """Handle 500 errors with standardized response"""
    return JSONResponse(
        status_code=500,
        content=error_response(
            code=ErrorCodes.INTERNAL_ERROR,
            message="Internal server error",
            status_code=500
        )
    )


# ============================================================================
# SPA Routing (must be last)
# ============================================================================

@app.get("/{full_path:path}")
async def serve_spa(request: Request, full_path: str):
    """Serve the React SPA for all non-API routes"""
    # Don't serve index.html for API routes
    if full_path.startswith("api"):
        return JSONResponse(
            status_code=404,
            content=error_response(
                code=ErrorCodes.NOT_FOUND,
                message=f"API endpoint not found: /api/{full_path.replace('api/', '')}",
                status_code=404
            )
        )

    # Check if it's a static file that exists
    file_path = FRONTEND_DIR / full_path
    if file_path.exists() and file_path.is_file():
        return FileResponse(file_path)

    # Serve index.html for all other routes (SPA routing)
    index_path = FRONTEND_DIR / "index.html"
    if index_path.exists():
        return FileResponse(index_path)

    # Fallback if frontend not built
    return success_response(
        data={
            "status": "healthy",
            "service": "HelioMetric API",
            "version": APP_VERSION,
            "message": "Frontend not built. Run 'yarn build' in frontend directory.",
            "api_docs": "/api/docs"
        },
        source="system"
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=os.getenv("NODE_ENV") != "production"
    )
