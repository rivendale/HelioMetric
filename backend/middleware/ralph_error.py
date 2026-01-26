"""
Ralph Error Middleware
Automatically reports errors and HTTP 5xx responses to Ralph Agent.

This middleware intercepts unhandled exceptions and server errors,
sending them to Ralph for centralized monitoring.
"""

import logging
import traceback
import asyncio
from typing import Callable
from datetime import datetime

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

logger = logging.getLogger(__name__)


class RalphErrorMiddleware(BaseHTTPMiddleware):
    """
    Middleware that reports errors to Ralph Agent.

    Reports:
    - Unhandled exceptions (500 errors)
    - HTTP 5xx responses
    - Slow requests (optional, if threshold configured)

    Usage:
        from middleware.ralph_error import RalphErrorMiddleware
        app.add_middleware(RalphErrorMiddleware)
    """

    def __init__(
        self,
        app,
        report_5xx: bool = True,
        slow_request_threshold_ms: int = 5000,
        exclude_paths: list = None
    ):
        """
        Initialize the middleware.

        Args:
            app: FastAPI application
            report_5xx: Whether to report HTTP 5xx responses
            slow_request_threshold_ms: Report requests slower than this (0 to disable)
            exclude_paths: List of paths to exclude from monitoring
        """
        super().__init__(app)
        self.report_5xx = report_5xx
        self.slow_request_threshold_ms = slow_request_threshold_ms
        self.exclude_paths = exclude_paths or ["/health", "/api/ralph-callback"]

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process the request and report errors to Ralph."""
        # Skip excluded paths
        if any(request.url.path.startswith(path) for path in self.exclude_paths):
            return await call_next(request)

        start_time = datetime.utcnow()

        try:
            response = await call_next(request)

            # Calculate request duration
            duration_ms = (datetime.utcnow() - start_time).total_seconds() * 1000

            # Report 5xx errors
            if self.report_5xx and response.status_code >= 500:
                await self._report_http_error(request, response.status_code, duration_ms)

            # Report slow requests
            if self.slow_request_threshold_ms > 0 and duration_ms > self.slow_request_threshold_ms:
                await self._report_slow_request(request, duration_ms)

            return response

        except Exception as e:
            # Calculate duration even for exceptions
            duration_ms = (datetime.utcnow() - start_time).total_seconds() * 1000

            # Report the exception
            await self._report_exception(request, e, duration_ms)

            # Re-raise to let FastAPI handle the response
            raise

    async def _report_http_error(
        self,
        request: Request,
        status_code: int,
        duration_ms: float
    ):
        """Report an HTTP 5xx error to Ralph."""
        try:
            from services import ralph_monitor

            severity = "critical" if status_code >= 503 else "high"

            # Fire and forget - don't wait for response
            asyncio.create_task(
                ralph_monitor.error_async(
                    title=f"HTTP {status_code} Error",
                    message=f"{request.method} {request.url.path}",
                    severity=severity,
                    status_code=status_code,
                    method=request.method,
                    path=str(request.url.path),
                    query=str(request.url.query),
                    duration_ms=round(duration_ms, 2),
                    client_host=request.client.host if request.client else "unknown"
                )
            )
        except Exception as e:
            logger.warning(f"Failed to report HTTP error to Ralph: {e}")

    async def _report_exception(
        self,
        request: Request,
        exception: Exception,
        duration_ms: float
    ):
        """Report an unhandled exception to Ralph."""
        try:
            from services import ralph_monitor

            # Get truncated traceback
            tb = traceback.format_exc()
            truncated_tb = tb[-1000:] if len(tb) > 1000 else tb

            # Fire and forget
            asyncio.create_task(
                ralph_monitor.error_async(
                    title="Unhandled Exception",
                    message=str(exception)[:500],
                    severity="critical",
                    exception_type=type(exception).__name__,
                    method=request.method,
                    path=str(request.url.path),
                    query=str(request.url.query),
                    duration_ms=round(duration_ms, 2),
                    traceback=truncated_tb,
                    client_host=request.client.host if request.client else "unknown"
                )
            )
        except Exception as e:
            logger.warning(f"Failed to report exception to Ralph: {e}")

    async def _report_slow_request(
        self,
        request: Request,
        duration_ms: float
    ):
        """Report a slow request to Ralph."""
        try:
            from services import ralph_monitor

            # Fire and forget
            asyncio.create_task(
                ralph_monitor.warning_async(
                    title="Slow Request",
                    message=f"{request.method} {request.url.path} took {duration_ms:.0f}ms",
                    method=request.method,
                    path=str(request.url.path),
                    duration_ms=round(duration_ms, 2),
                    threshold_ms=self.slow_request_threshold_ms
                )
            )
        except Exception as e:
            logger.warning(f"Failed to report slow request to Ralph: {e}")


def create_ralph_exception_handler():
    """
    Create an exception handler that reports to Ralph.

    Usage:
        from middleware.ralph_error import create_ralph_exception_handler
        app.add_exception_handler(Exception, create_ralph_exception_handler())
    """
    async def ralph_exception_handler(request: Request, exc: Exception):
        """Global exception handler that reports to Ralph."""
        try:
            from services import ralph_monitor

            # Report the error
            await ralph_monitor.error_async(
                title="Unhandled Exception",
                message=str(exc)[:500],
                severity="critical",
                exception_type=type(exc).__name__,
                path=str(request.url.path),
                traceback=traceback.format_exc()[-1000:]
            )
        except Exception as e:
            logger.warning(f"Failed to report exception to Ralph: {e}")

        # Return a generic error response
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "Internal server error"
                },
                "meta": {
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                }
            }
        )

    return ralph_exception_handler
