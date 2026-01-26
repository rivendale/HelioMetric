"""
HelioMetric FastAPI Backend
Serves both API endpoints and the React/Vite static frontend

Features:
- CORS configuration with environment-aware origins
- Security headers middleware
- Standardized API responses with dual-case field names
- Ralph Agent monitoring integration (bidirectional)
"""

import os
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from routers import noaa, location, geocode
from routers.ralph_callback import router as ralph_callback_router, setup_ralph_logging
from utils.responses import success_response, error_response, ErrorCodes
from services import ralph_monitor
from middleware.ralph_error import RalphErrorMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


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

# Ralph Agent URL for CORS
RALPH_URL = os.getenv("RALPH_MONITOR_URL", "https://ralph-agent.onrender.com")
if RALPH_URL:
    CORS_ORIGINS.append(RALPH_URL)

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
# Application Lifespan (Startup & Shutdown)
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.

    Startup:
    - Initialize logging
    - Send startup event to Ralph
    - Register with Ralph for bidirectional communication

    Shutdown:
    - Send shutdown event to Ralph
    """
    # ==================== STARTUP ====================
    logger.info(f"HelioMetric v{APP_VERSION} starting...")
    logger.info(f"Environment: {'production' if IS_PRODUCTION else 'development'}")
    logger.info(f"Frontend directory: {FRONTEND_DIR}")
    logger.info(f"Frontend exists: {FRONTEND_DIR.exists()}")

    # Setup Ralph logging handler
    setup_ralph_logging()

    # Log Ralph configuration status
    ralph_config = ralph_monitor.get_config_status()
    logger.info(f"Ralph monitoring config: {ralph_config}")

    # Send startup event to Ralph
    if ralph_monitor.is_configured():
        try:
            startup_result = ralph_monitor.startup(version=APP_VERSION)
            logger.info(f"Ralph startup event: {startup_result.get('status', 'unknown')}")

            # Register for bidirectional communication
            register_result = ralph_monitor.register_with_ralph(
                name="HelioMetric",
                capabilities=[
                    "health_check",
                    "log_fetch",
                    "log_analysis",
                    "schema_request",
                    "test_data",
                    "metrics"
                ],
                metadata={
                    "environment": "production" if IS_PRODUCTION else "development",
                    "version": APP_VERSION,
                    "framework": "FastAPI",
                    "description": "Heliospheric Resonance Dashboard"
                }
            )
            logger.info(f"Ralph registration: {register_result.get('status', 'unknown')}")
        except Exception as e:
            logger.warning(f"Failed to connect to Ralph Agent: {e}")
    else:
        logger.info("Ralph monitoring not configured - skipping registration")

    yield

    # ==================== SHUTDOWN ====================
    logger.info("HelioMetric shutting down...")

    # Send shutdown event to Ralph
    if ralph_monitor.is_configured():
        try:
            shutdown_result = ralph_monitor.shutdown(reason="Application shutdown")
            logger.info(f"Ralph shutdown event: {shutdown_result.get('status', 'unknown')}")
        except Exception as e:
            logger.warning(f"Failed to send shutdown event to Ralph: {e}")

    logger.info("HelioMetric shutdown complete")


# ============================================================================
# Application Setup
# ============================================================================

app = FastAPI(
    title="HelioMetric",
    description="Heliospheric Resonance Dashboard - Space weather and geomagnetic analysis API",
    version=APP_VERSION,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Add Ralph error middleware (must be first to catch all errors)
app.add_middleware(
    RalphErrorMiddleware,
    report_5xx=True,
    slow_request_threshold_ms=5000,
    exclude_paths=["/health", "/api/ralph-callback"]
)

# Add security headers middleware
app.add_middleware(SecurityHeadersMiddleware)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With", "X-Ralph-Signature"],
    expose_headers=["X-Request-ID"],
    max_age=86400,  # Cache preflight for 24 hours
)

# Include API routers
app.include_router(noaa.router, prefix="/api", tags=["NOAA"])
app.include_router(location.router, prefix="/api", tags=["Location"])
app.include_router(geocode.router, prefix="/api", tags=["Geocode"])
app.include_router(ralph_callback_router, prefix="/api", tags=["Ralph Monitoring"])


# ============================================================================
# Health & Info Endpoints
# ============================================================================

@app.get("/health")
async def health_check():
    """
    Health check endpoint for Render and monitoring.

    Returns service status, version, and basic system information.
    Used by deployment platforms for health monitoring.
    Ralph Agent checks this endpoint every 6 hours.
    """
    return success_response(
        data={
            "status": "healthy",
            "service": "HelioMetric",
            "version": APP_VERSION,
            "environment": "production" if IS_PRODUCTION else "development",
            "uptime_seconds": ralph_monitor.get_uptime_seconds(),
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
                    "path": "/api/ralph-callback",
                    "method": "POST",
                    "description": "Ralph Agent monitoring callback"
                },
                {
                    "path": "/health",
                    "method": "GET",
                    "description": "Service health check"
                },
            ],
            "monitoring": {
                "ralph_configured": ralph_monitor.is_configured(),
                "ralph_url": ralph_monitor.RALPH_URL,
                "project_id": ralph_monitor.PROJECT_ID
            },
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
    # Report to Ralph
    if ralph_monitor.is_configured():
        try:
            ralph_monitor.error(
                title="HTTP 500 Error",
                message=f"{request.method} {request.url.path}",
                severity="critical",
                exception=str(exc)
            )
        except Exception:
            pass  # Don't let Ralph errors affect the response

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
