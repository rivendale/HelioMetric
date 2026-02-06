"""
Geocoding API Router
POST /api/geocode - Convert address to coordinates

Provides geocoding functionality using Google Maps API with Redis caching.
Results are cached for 30 days to reduce API costs and improve response times.
"""

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator

from services.maps import geocode_address, is_google_maps_configured
from utils.responses import (
    success_response,
    error_response,
    ErrorCodes,
    add_camel_case_aliases
)

router = APIRouter()


# ============================================================================
# Request Models
# ============================================================================

class GeocodeRequest(BaseModel):
    """Geocode request body"""
    address: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Address to geocode"
    )

    @field_validator('address')
    @classmethod
    def validate_address(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Address cannot be empty")
        if len(cleaned) < 3:
            raise ValueError("Address must be at least 3 characters")
        return cleaned


# ============================================================================
# API Endpoints
# ============================================================================

@router.post("/geocode")
async def geocode(request: GeocodeRequest):
    """
    Convert address to coordinates.

    Uses Google Maps Geocoding API with Redis caching (30 day TTL).
    Response includes both snake_case and camelCase field names.

    Request Body:
        address: Address string to geocode

    Returns:
        Standardized API response with location data:
        - lat/lng coordinates
        - formatted_address/formattedAddress
        - place_id/placeId
        - cached: whether result was from cache

    Errors:
        400: Invalid or missing address
        404: Address not found
        503: Geocoding service not configured
    """
    try:
        # Check if service is configured
        if not is_google_maps_configured():
            return JSONResponse(
                status_code=503,
                content=error_response(
                    code=ErrorCodes.SERVICE_UNAVAILABLE,
                    message="Geocoding service not available. Google Maps API key not configured.",
                    status_code=503
                )
            )

        # Perform geocoding
        result = await geocode_address(request.address)

        if not result.success:
            # Determine appropriate error code
            error_code = ErrorCodes.NOT_FOUND
            status_code = 404

            if result.error and "API" in result.error:
                error_code = ErrorCodes.EXTERNAL_API_ERROR
                status_code = 502

            return JSONResponse(
                status_code=status_code,
                content=error_response(
                    code=error_code,
                    message=result.error or "No results found for this address",
                    status_code=status_code,
                    details={"address": request.address}
                )
            )

        # Build response with location data
        location_data = None
        if result.location:
            location_data = add_camel_case_aliases(result.location.model_dump())

        return success_response(
            data={
                "location": location_data,
            },
            cached=result.cached,
            source="google_maps"
        )

    except ValueError as e:
        return JSONResponse(
            status_code=400,
            content=error_response(
                code=ErrorCodes.VALIDATION_ERROR,
                message=str(e),
                status_code=400,
                field="address"
            )
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content=error_response(
                code=ErrorCodes.INTERNAL_ERROR,
                message="Geocoding request failed",
                status_code=500,
                details={"error": str(e)}
            )
        )


@router.get("/geocode")
async def geocode_info():
    """
    Get endpoint information and service status.

    Returns information about the geocoding endpoint
    and whether the service is currently available.
    """
    is_available = is_google_maps_configured()

    return success_response(
        data={
            "available": is_available,
            "endpoint": "POST /api/geocode",
            "method": "POST",
            "body": {
                "address": "string (required, 3-500 characters)"
            },
            "description": "Convert address to coordinates using Google Maps Geocoding API",
            "caching": {
                "enabled": True,
                "ttl_days": 30,
                "backend": "redis"
            },
            "response_fields": [
                "lat",
                "lng",
                "formatted_address/formattedAddress",
                "place_id/placeId",
                "timezone (optional)",
                "magnetic_declination/magneticDeclination (optional)"
            ],
            "status": "operational" if is_available else "unavailable"
        },
        source="documentation"
    )
