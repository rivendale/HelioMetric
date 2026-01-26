"""
Ralph Agent Callback Router
Handles incoming requests FROM Ralph Agent for logs, schema, test data, metrics.

This endpoint receives requests from Ralph and responds with the requested data.
All requests are authenticated via HMAC signature verification.
"""

import json
import logging
import traceback
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Request, Header, HTTPException
from pydantic import BaseModel, Field

from services import ralph_monitor
from services.ralph_monitor import APP_VERSION, APP_NAME, CLIENT_VERSION, get_uptime_seconds

logger = logging.getLogger(__name__)

router = APIRouter()


# ============================================================================
# Request/Response Models
# ============================================================================

class RalphCallbackRequest(BaseModel):
    """Incoming request from Ralph Agent."""
    request_id: str = Field(description="Unique request identifier")
    type: str = Field(description="Request type (health_check, log_fetch, etc.)")
    payload: Optional[Dict[str, Any]] = Field(default={}, description="Request payload")


class RalphCallbackResponse(BaseModel):
    """Response to Ralph Agent."""
    request_id: str
    status: str  # "success" or "error"
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


# ============================================================================
# In-Memory Log Buffer
# ============================================================================

# Simple in-memory log buffer for recent logs
# In production, you might want to use a proper logging backend
_log_buffer: List[Dict[str, Any]] = []
_max_log_buffer_size = 1000


class RalphLogHandler(logging.Handler):
    """Custom log handler that stores logs in memory for Ralph to fetch."""

    def emit(self, record: logging.LogRecord):
        global _log_buffer

        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = "".join(traceback.format_exception(*record.exc_info))

        _log_buffer.append(log_entry)

        # Trim buffer if too large
        if len(_log_buffer) > _max_log_buffer_size:
            _log_buffer = _log_buffer[-_max_log_buffer_size:]


def setup_ralph_logging():
    """Set up the Ralph log handler on the root logger."""
    handler = RalphLogHandler()
    handler.setLevel(logging.WARNING)  # Only capture warnings and above
    logging.getLogger().addHandler(handler)


# ============================================================================
# Helper Functions
# ============================================================================

def fetch_recent_logs(
    lines: int = 100,
    min_level: str = "ERROR",
    hours: int = 24
) -> List[Dict[str, Any]]:
    """
    Fetch recent log entries from the in-memory buffer.

    Args:
        lines: Maximum number of log entries to return
        min_level: Minimum log level to include
        hours: Only include logs from the last N hours

    Returns:
        List of log entries
    """
    level_order = {"DEBUG": 10, "INFO": 20, "WARNING": 30, "ERROR": 40, "CRITICAL": 50}
    min_level_value = level_order.get(min_level.upper(), 40)

    cutoff_time = datetime.utcnow() - timedelta(hours=hours)
    cutoff_str = cutoff_time.isoformat() + "Z"

    filtered_logs = [
        log for log in _log_buffer
        if level_order.get(log.get("level", "INFO"), 20) >= min_level_value
        and log.get("timestamp", "") >= cutoff_str
    ]

    # Return most recent logs first
    return list(reversed(filtered_logs[-lines:]))


def analyze_logs(
    pattern: Optional[str] = None,
    hours: int = 24
) -> Dict[str, Any]:
    """
    Analyze logs and return summary statistics.

    Args:
        pattern: Optional error pattern to search for
        hours: Time range in hours to analyze

    Returns:
        Analysis summary
    """
    cutoff_time = datetime.utcnow() - timedelta(hours=hours)
    cutoff_str = cutoff_time.isoformat() + "Z"

    recent_logs = [
        log for log in _log_buffer
        if log.get("timestamp", "") >= cutoff_str
    ]

    # Count by level
    level_counts = {}
    for log in recent_logs:
        level = log.get("level", "UNKNOWN")
        level_counts[level] = level_counts.get(level, 0) + 1

    # Find errors
    errors = [log for log in recent_logs if log.get("level") in ("ERROR", "CRITICAL")]

    # Group errors by message (simplified)
    error_groups = {}
    for error in errors:
        msg = error.get("message", "")[:100]  # First 100 chars
        if msg not in error_groups:
            error_groups[msg] = {"count": 0, "first_seen": error.get("timestamp"), "last_seen": error.get("timestamp")}
        error_groups[msg]["count"] += 1
        error_groups[msg]["last_seen"] = error.get("timestamp")

    # Sort by count and get top errors
    top_errors = sorted(
        [{"message": k, **v} for k, v in error_groups.items()],
        key=lambda x: x["count"],
        reverse=True
    )[:10]

    # Filter by pattern if specified
    if pattern:
        top_errors = [e for e in top_errors if pattern.lower() in e["message"].lower()]

    # Determine trend
    total_errors = len(errors)
    trend = "stable"
    if total_errors > 50:
        trend = "increasing"
    elif total_errors < 5:
        trend = "decreasing"

    return {
        "total_logs": len(recent_logs),
        "total_errors": total_errors,
        "unique_errors": len(error_groups),
        "level_counts": level_counts,
        "top_errors": top_errors,
        "trend": trend,
        "time_range_hours": hours
    }


def get_api_schema() -> Dict[str, Any]:
    """Return the OpenAPI schema for this API."""
    # This will be populated by the main app
    return {
        "note": "Schema available at /api/openapi.json",
        "version": APP_VERSION
    }


def get_event_schema() -> Dict[str, Any]:
    """Return the event schema for this application."""
    return {
        "events": [
            {
                "name": "startup",
                "description": "Application startup event",
                "fields": ["version", "timestamp"]
            },
            {
                "name": "shutdown",
                "description": "Application shutdown event",
                "fields": ["reason", "uptime_seconds"]
            },
            {
                "name": "error",
                "description": "Application error event",
                "fields": ["title", "message", "severity", "traceback"]
            },
            {
                "name": "noaa_fetch",
                "description": "NOAA data fetch event",
                "fields": ["kp_index", "status", "cached"]
            }
        ]
    }


def get_data_schema() -> Dict[str, Any]:
    """Return the data model schema for this application."""
    return {
        "models": {
            "KIndexReading": {
                "description": "Single K-Index reading from NOAA",
                "fields": {
                    "time_tag": "string (ISO timestamp)",
                    "kp_index": "float (0-9)",
                    "observed_time": "datetime"
                }
            },
            "LocationAnalysis": {
                "description": "Geomagnetic analysis for a location",
                "fields": {
                    "coordinates": {"lat": "float", "lng": "float"},
                    "geomagnetic": {"latitude": "float", "declination": "float"},
                    "storm_impact": {"factor": "float", "description": "string", "aurora_likelihood": "string"}
                }
            },
            "GeoLocation": {
                "description": "Geocoded location",
                "fields": {
                    "lat": "float",
                    "lng": "float",
                    "formatted_address": "string",
                    "place_id": "string"
                }
            }
        }
    }


def generate_test_data(data_type: str = "sample", count: int = 5) -> List[Dict[str, Any]]:
    """
    Generate sample/test data based on type.

    Args:
        data_type: Type of data to generate
        count: Number of samples

    Returns:
        List of sample data
    """
    import random

    if data_type == "kindex" or data_type == "noaa":
        return [
            {
                "time_tag": f"2026-01-26T{10+i:02d}:00:00Z",
                "kp_index": round(random.uniform(1.0, 7.0), 2),
                "status": random.choice(["quiet", "unsettled", "storm"])
            }
            for i in range(count)
        ]

    elif data_type == "location":
        locations = [
            {"name": "New York", "lat": 40.7128, "lng": -74.0060},
            {"name": "London", "lat": 51.5074, "lng": -0.1278},
            {"name": "Tokyo", "lat": 35.6762, "lng": 139.6503},
            {"name": "Sydney", "lat": -33.8688, "lng": 151.2093},
            {"name": "Reykjavik", "lat": 64.1466, "lng": -21.9426},
        ]
        return locations[:count]

    elif data_type == "zodiac":
        zodiacs = [
            {"name": "Rat", "element": "Water", "year": 2020},
            {"name": "Ox", "element": "Earth", "year": 2021},
            {"name": "Tiger", "element": "Wood", "year": 2022},
            {"name": "Rabbit", "element": "Wood", "year": 2023},
            {"name": "Dragon", "element": "Earth", "year": 2024},
        ]
        return zodiacs[:count]

    else:
        # Generic sample data
        return [
            {
                "id": i + 1,
                "type": data_type,
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "value": round(random.random() * 100, 2)
            }
            for i in range(count)
        ]


def get_system_metrics() -> Dict[str, Any]:
    """Get current system metrics."""
    metrics = {
        "uptime_seconds": get_uptime_seconds(),
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

    # Try to get CPU/memory metrics
    try:
        import psutil
        metrics["cpu_percent"] = psutil.cpu_percent(interval=0.1)
        memory = psutil.Process().memory_info()
        metrics["memory_mb"] = round(memory.rss / 1024 / 1024, 2)
        metrics["memory_percent"] = psutil.Process().memory_percent()
    except ImportError:
        metrics["cpu_percent"] = None
        metrics["memory_mb"] = None
        metrics["note"] = "psutil not installed - limited metrics available"

    return metrics


# ============================================================================
# Callback Endpoint
# ============================================================================

@router.post("/ralph-callback")
async def ralph_callback(
    request: Request,
    x_ralph_signature: Optional[str] = Header(None, alias="X-Ralph-Signature")
):
    """
    Callback endpoint for Ralph Agent requests.

    Handles the following request types:
    - health_check: Basic health check
    - log_fetch: Fetch recent log entries
    - log_analysis: Analyze logs for patterns
    - schema_request: Return API/database/event schema
    - test_data: Generate test/demo data
    - metrics: Return performance metrics

    All requests are authenticated via HMAC signature.
    """
    body = await request.body()

    # Verify signature
    if not ralph_monitor.verify_signature(body, x_ralph_signature or ""):
        logger.warning("Invalid Ralph signature received")
        raise HTTPException(status_code=401, detail="Invalid signature")

    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    request_id = data.get("request_id", "unknown")
    request_type = data.get("type", "")
    payload = data.get("payload", {})

    logger.info(f"Ralph callback received: type={request_type}, request_id={request_id}")

    try:
        if request_type == "health_check":
            return {
                "request_id": request_id,
                "status": "success",
                "data": {
                    "healthy": True,
                    "service": APP_NAME,
                    "version": APP_VERSION,
                    "uptime_seconds": get_uptime_seconds(),
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                }
            }

        elif request_type == "log_fetch":
            lines = payload.get("lines", 100)
            level = payload.get("level", "ERROR")
            since_hours = payload.get("since_hours", 24)

            logs = fetch_recent_logs(lines=lines, min_level=level, hours=since_hours)

            return {
                "request_id": request_id,
                "status": "success",
                "data": {
                    "logs": logs,
                    "count": len(logs),
                    "filters": {"lines": lines, "level": level, "since_hours": since_hours}
                }
            }

        elif request_type == "log_analysis":
            pattern = payload.get("error_pattern")
            hours = payload.get("time_range_hours", 24)

            analysis = analyze_logs(pattern=pattern, hours=hours)

            return {
                "request_id": request_id,
                "status": "success",
                "data": analysis
            }

        elif request_type == "schema_request":
            schema_type = payload.get("schema_type", "api")

            if schema_type == "api":
                return {
                    "request_id": request_id,
                    "status": "success",
                    "data": {
                        "type": "api",
                        "openapi_url": "/api/openapi.json",
                        "docs_url": "/api/docs",
                        "version": APP_VERSION
                    }
                }
            elif schema_type == "database" or schema_type == "data":
                return {
                    "request_id": request_id,
                    "status": "success",
                    "data": get_data_schema()
                }
            elif schema_type == "events":
                return {
                    "request_id": request_id,
                    "status": "success",
                    "data": get_event_schema()
                }
            else:
                return {
                    "request_id": request_id,
                    "status": "success",
                    "data": {
                        "api": get_api_schema(),
                        "data": get_data_schema(),
                        "events": get_event_schema()
                    }
                }

        elif request_type == "test_data":
            data_type = payload.get("data_type", "sample")
            count = min(payload.get("count", 5), 100)  # Cap at 100

            samples = generate_test_data(data_type=data_type, count=count)

            return {
                "request_id": request_id,
                "status": "success",
                "data": {
                    "samples": samples,
                    "type": data_type,
                    "count": len(samples)
                }
            }

        elif request_type == "metrics":
            metric_types = payload.get("metric_types", ["cpu", "memory", "uptime"])

            metrics = get_system_metrics()

            # Filter to requested metrics
            if metric_types:
                filtered_metrics = {"timestamp": metrics.get("timestamp")}
                for mt in metric_types:
                    if mt == "cpu" and "cpu_percent" in metrics:
                        filtered_metrics["cpu_percent"] = metrics["cpu_percent"]
                    elif mt == "memory" and "memory_mb" in metrics:
                        filtered_metrics["memory_mb"] = metrics["memory_mb"]
                        filtered_metrics["memory_percent"] = metrics.get("memory_percent")
                    elif mt == "uptime":
                        filtered_metrics["uptime_seconds"] = metrics["uptime_seconds"]
                metrics = filtered_metrics

            return {
                "request_id": request_id,
                "status": "success",
                "data": metrics
            }

        elif request_type == "update_check":
            # Check for Ralph SDK updates
            update_info = await ralph_monitor.check_for_updates_async()

            return {
                "request_id": request_id,
                "status": "success",
                "data": {
                    "client_version": CLIENT_VERSION,
                    "app_version": APP_VERSION,
                    "update_info": update_info
                }
            }

        elif request_type == "version_info":
            # Return version information
            return {
                "request_id": request_id,
                "status": "success",
                "data": {
                    "app_name": APP_NAME,
                    "app_version": APP_VERSION,
                    "client_version": CLIENT_VERSION,
                    "uptime_seconds": get_uptime_seconds(),
                    "config": ralph_monitor.get_config_status()
                }
            }

        else:
            logger.warning(f"Unknown Ralph request type: {request_type}")
            return {
                "request_id": request_id,
                "status": "error",
                "error": f"Unknown request type: {request_type}"
            }

    except Exception as e:
        logger.error(f"Error handling Ralph callback: {e}", exc_info=True)
        return {
            "request_id": request_id,
            "status": "error",
            "error": str(e)
        }


@router.get("/ralph-callback")
async def ralph_callback_info():
    """Get callback endpoint information and supported capabilities."""
    return {
        "endpoint": "POST /api/ralph-callback",
        "description": "Callback endpoint for Ralph Agent monitoring requests",
        "capabilities": [
            "health_check",
            "log_fetch",
            "log_analysis",
            "schema_request",
            "test_data",
            "metrics",
            "update_check",
            "version_info"
        ],
        "authentication": "HMAC-SHA256 signature via X-Ralph-Signature header",
        "project_id": ralph_monitor.PROJECT_ID,
        "client_version": CLIENT_VERSION,
        "app_version": APP_VERSION,
        "configured": ralph_monitor.is_configured()
    }
