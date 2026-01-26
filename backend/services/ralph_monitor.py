"""
Ralph Agent Monitoring Client
Handles both sending events TO Ralph and receiving requests FROM Ralph.

This module provides bidirectional communication with the Ralph Agent
centralized monitoring system for error tracking, deployments, and metrics.

Environment Variables:
    RALPH_MONITOR_URL: Ralph Agent URL (default: https://ralph-agent.onrender.com)
    RALPH_MONITOR_SECRET: Shared secret for HMAC authentication
    RALPH_PROJECT_ID: Project identifier (helio-metric)
    MY_CALLBACK_URL: This app's callback endpoint URL
"""

import os
import json
import hmac
import hashlib
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime

try:
    import httpx
    HAS_HTTPX = True
except ImportError:
    HAS_HTTPX = False
    import urllib.request
    import urllib.error

logger = logging.getLogger(__name__)

# ============================================================================
# Configuration
# ============================================================================

RALPH_URL = os.getenv("RALPH_MONITOR_URL", "https://ralph-agent.onrender.com")
SECRET = os.getenv("RALPH_MONITOR_SECRET", "")
PROJECT_ID = os.getenv("RALPH_PROJECT_ID", "helio-metric")
CALLBACK_URL = os.getenv("MY_CALLBACK_URL", "")

# Application metadata
APP_VERSION = "0.4.0"
APP_NAME = "HelioMetric"

# Startup timestamp for uptime calculation
_startup_time: Optional[datetime] = None


def set_startup_time():
    """Set the startup timestamp for uptime calculations."""
    global _startup_time
    _startup_time = datetime.utcnow()


def get_uptime_seconds() -> int:
    """Get application uptime in seconds."""
    if _startup_time is None:
        return 0
    return int((datetime.utcnow() - _startup_time).total_seconds())


# ============================================================================
# Signature Utilities
# ============================================================================

def _sign_payload(payload: bytes) -> str:
    """Generate HMAC-SHA256 signature for payload."""
    if not SECRET:
        return ""
    digest = hmac.new(SECRET.encode(), payload, hashlib.sha256).hexdigest()
    return f"sha256={digest}"


def verify_signature(body: bytes, signature: str) -> bool:
    """
    Verify HMAC signature from Ralph.

    Args:
        body: Raw request body bytes
        signature: X-Ralph-Signature header value

    Returns:
        True if signature is valid or no secret configured
    """
    if not SECRET:
        logger.warning("RALPH_MONITOR_SECRET not configured - skipping signature verification")
        return True
    if not signature:
        logger.warning("No signature provided in request")
        return False

    expected = _sign_payload(body)

    # Handle both with and without "sha256=" prefix
    if signature.startswith("sha256="):
        return hmac.compare_digest(expected, signature)
    return hmac.compare_digest(expected[7:], signature)


# ============================================================================
# HTTP Request Utilities
# ============================================================================

def _send(url: str, payload: dict, timeout: float = 10.0) -> dict:
    """
    Send authenticated request to Ralph.

    Args:
        url: Full URL to send request to
        payload: JSON-serializable payload
        timeout: Request timeout in seconds

    Returns:
        Response JSON or error dict
    """
    body = json.dumps(payload).encode()
    signature = _sign_payload(body)
    headers = {"Content-Type": "application/json"}
    if signature:
        headers["X-Ralph-Signature"] = signature

    try:
        if HAS_HTTPX:
            with httpx.Client(timeout=timeout) as client:
                response = client.post(url, content=body, headers=headers)
                return response.json()
        else:
            req = urllib.request.Request(url, data=body, headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=int(timeout)) as resp:
                return json.loads(resp.read().decode())
    except Exception as e:
        logger.warning(f"Ralph request to {url} failed: {e}")
        return {"status": "error", "error": str(e)}


async def _send_async(url: str, payload: dict, timeout: float = 10.0) -> dict:
    """
    Send authenticated request to Ralph (async version).

    Args:
        url: Full URL to send request to
        payload: JSON-serializable payload
        timeout: Request timeout in seconds

    Returns:
        Response JSON or error dict
    """
    body = json.dumps(payload).encode()
    signature = _sign_payload(body)
    headers = {"Content-Type": "application/json"}
    if signature:
        headers["X-Ralph-Signature"] = signature

    try:
        if HAS_HTTPX:
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.post(url, content=body, headers=headers)
                return response.json()
        else:
            # Fall back to sync for urllib
            return _send(url, payload, timeout)
    except Exception as e:
        logger.warning(f"Ralph async request to {url} failed: {e}")
        return {"status": "error", "error": str(e)}


# ============================================================================
# OUTBOUND: Send events TO Ralph
# ============================================================================

def send_event(
    event_type: str,
    title: str,
    message: str = "",
    severity: str = "info",
    metadata: Optional[dict] = None
) -> dict:
    """
    Send an event to Ralph monitoring.

    Args:
        event_type: Type of event (error, warning, info, startup, shutdown)
        title: Event title
        message: Detailed message
        severity: Event severity (info, low, medium, high, critical)
        metadata: Additional metadata dict

    Returns:
        Response from Ralph
    """
    if not PROJECT_ID:
        logger.debug("RALPH_PROJECT_ID not set - skipping event")
        return {"status": "skipped", "reason": "no project id"}

    payload = {
        "type": event_type,
        "severity": severity,
        "title": title,
        "message": message,
        "metadata": {
            "app_version": APP_VERSION,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            **(metadata or {})
        }
    }

    return _send(f"{RALPH_URL}/api/monitor/webhook/{PROJECT_ID}", payload)


async def send_event_async(
    event_type: str,
    title: str,
    message: str = "",
    severity: str = "info",
    metadata: Optional[dict] = None
) -> dict:
    """Async version of send_event."""
    if not PROJECT_ID:
        return {"status": "skipped", "reason": "no project id"}

    payload = {
        "type": event_type,
        "severity": severity,
        "title": title,
        "message": message,
        "metadata": {
            "app_version": APP_VERSION,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            **(metadata or {})
        }
    }

    return await _send_async(f"{RALPH_URL}/api/monitor/webhook/{PROJECT_ID}", payload)


# ============================================================================
# Convenience Event Functions
# ============================================================================

def error(title: str, message: str = "", severity: str = "high", **metadata) -> dict:
    """Send an error event to Ralph."""
    return send_event("error", title, message, severity, metadata)


async def error_async(title: str, message: str = "", severity: str = "high", **metadata) -> dict:
    """Send an error event to Ralph (async)."""
    return await send_event_async("error", title, message, severity, metadata)


def warning(title: str, message: str = "", **metadata) -> dict:
    """Send a warning event to Ralph."""
    return send_event("warning", title, message, "medium", metadata)


async def warning_async(title: str, message: str = "", **metadata) -> dict:
    """Send a warning event to Ralph (async)."""
    return await send_event_async("warning", title, message, "medium", metadata)


def info(title: str, message: str = "", **metadata) -> dict:
    """Send an info event to Ralph."""
    return send_event("info", title, message, "info", metadata)


async def info_async(title: str, message: str = "", **metadata) -> dict:
    """Send an info event to Ralph (async)."""
    return await send_event_async("info", title, message, "info", metadata)


def startup(version: str = APP_VERSION) -> dict:
    """
    Send startup event to Ralph.
    Call this when the application starts.
    """
    set_startup_time()
    return send_event(
        "startup",
        f"{APP_NAME} Started",
        f"Version: {version}" if version else "",
        "info",
        {"version": version}
    )


def shutdown(reason: str = "Normal shutdown") -> dict:
    """
    Send shutdown event to Ralph.
    Call this when the application is shutting down.
    """
    return send_event(
        "shutdown",
        f"{APP_NAME} Shutdown",
        reason,
        "info",
        {"uptime_seconds": get_uptime_seconds()}
    )


def deployment(
    status: str,
    commit: str = "",
    environment: str = "production",
    **metadata
) -> dict:
    """
    Send deployment event to Ralph.

    Args:
        status: Deployment status (started, success, failed)
        commit: Git commit hash
        environment: Deployment environment
        **metadata: Additional deployment metadata
    """
    if not PROJECT_ID:
        return {"status": "skipped", "reason": "no project id"}

    payload = {
        "status": status,
        "commit": commit,
        "environment": environment,
        "version": APP_VERSION,
        **metadata
    }

    return _send(f"{RALPH_URL}/api/monitor/webhook/{PROJECT_ID}/deployment", payload)


# ============================================================================
# REGISTRATION: Connect for bidirectional communication
# ============================================================================

def register_with_ralph(
    name: str = APP_NAME,
    capabilities: Optional[List[str]] = None,
    metadata: Optional[dict] = None
) -> dict:
    """
    Register this project with Ralph for bidirectional communication.
    Call this on application startup.

    Args:
        name: Display name for this project
        capabilities: List of supported capabilities
        metadata: Additional registration metadata

    Capabilities:
        - health_check: Basic health check
        - log_fetch: Fetch log entries
        - log_analysis: Analyze logs for patterns
        - schema_request: Return API/database schema
        - test_data: Generate test/demo data
        - metrics: Return performance metrics

    Returns:
        Registration response from Ralph
    """
    if not PROJECT_ID:
        logger.warning("Cannot register: RALPH_PROJECT_ID not set")
        return {"status": "skipped", "reason": "no project id"}

    if not CALLBACK_URL:
        logger.warning("Cannot register: MY_CALLBACK_URL not set")
        return {"status": "skipped", "reason": "no callback url"}

    default_capabilities = [
        "health_check",
        "log_fetch",
        "log_analysis",
        "schema_request",
        "test_data",
        "metrics"
    ]

    payload = {
        "project_id": PROJECT_ID,
        "name": name,
        "callback_url": CALLBACK_URL,
        "capabilities": capabilities or default_capabilities,
        "metadata": {
            "version": APP_VERSION,
            "framework": "FastAPI",
            "python_version": f"{__import__('sys').version_info.major}.{__import__('sys').version_info.minor}",
            **(metadata or {})
        }
    }

    result = _send(f"{RALPH_URL}/api/monitor/connect", payload)

    if result.get("status") == "success":
        logger.info(f"Successfully registered with Ralph Agent as '{name}'")
    else:
        logger.warning(f"Failed to register with Ralph: {result}")

    return result


async def register_with_ralph_async(
    name: str = APP_NAME,
    capabilities: Optional[List[str]] = None,
    metadata: Optional[dict] = None
) -> dict:
    """Async version of register_with_ralph."""
    if not PROJECT_ID or not CALLBACK_URL:
        logger.warning("Cannot register: RALPH_PROJECT_ID or MY_CALLBACK_URL not set")
        return {"status": "skipped"}

    default_capabilities = [
        "health_check",
        "log_fetch",
        "log_analysis",
        "schema_request",
        "test_data",
        "metrics"
    ]

    payload = {
        "project_id": PROJECT_ID,
        "name": name,
        "callback_url": CALLBACK_URL,
        "capabilities": capabilities or default_capabilities,
        "metadata": {
            "version": APP_VERSION,
            "framework": "FastAPI",
            **(metadata or {})
        }
    }

    result = await _send_async(f"{RALPH_URL}/api/monitor/connect", payload)

    if result.get("status") == "success":
        logger.info(f"Successfully registered with Ralph Agent as '{name}'")

    return result


# ============================================================================
# Configuration Check
# ============================================================================

def is_configured() -> bool:
    """Check if Ralph monitoring is properly configured."""
    return bool(PROJECT_ID and SECRET)


def get_config_status() -> dict:
    """Get current configuration status."""
    return {
        "ralph_url": RALPH_URL,
        "project_id": PROJECT_ID,
        "callback_url": CALLBACK_URL,
        "secret_configured": bool(SECRET),
        "httpx_available": HAS_HTTPX,
        "fully_configured": is_configured() and bool(CALLBACK_URL)
    }
