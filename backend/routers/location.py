"""
Location Analysis API Router
POST /api/location - Get geomagnetic impact analysis for coordinates

Provides geomagnetic latitude, magnetic declination, storm impact analysis,
and optional timezone information for given coordinates.
"""

from typing import Optional
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from services.maps import (
    calculate_geomagnetic_latitude,
    approximate_magnetic_declination,
    get_storm_impact_factor,
    get_timezone,
    is_google_maps_configured
)
from utils.responses import (
    success_response,
    error_response,
    ErrorCodes,
    CamelCaseModel
)

router = APIRouter()


# ============================================================================
# Request/Response Models with camelCase aliases
# ============================================================================

class LocationRequest(BaseModel):
    """Location analysis request body"""
    lat: float = Field(..., ge=-90, le=90, description="Latitude (-90 to 90)")
    lng: float = Field(..., ge=-180, le=180, description="Longitude (-180 to 180)")


class TimezoneInfo(CamelCaseModel):
    """Timezone information with dual-case field names"""
    id: str = Field(description="Timezone ID (e.g., 'America/New_York')")
    name: str = Field(description="Timezone display name")
    utc_offset: int = Field(description="Total UTC offset in seconds (raw + DST)")


class GeomagneticInfo(CamelCaseModel):
    """Geomagnetic properties with dual-case field names"""
    latitude: float = Field(description="Geomagnetic latitude in degrees")
    declination: float = Field(description="Magnetic declination in degrees")


class StormImpactInfo(CamelCaseModel):
    """Storm impact analysis with dual-case field names"""
    factor: float = Field(description="Storm impact multiplier (0.5-1.5)")
    description: str = Field(description="Human-readable impact description")
    aurora_likelihood: str = Field(description="Aurora visibility likelihood")


class CoordinatesInfo(CamelCaseModel):
    """Coordinate information"""
    lat: float = Field(description="Latitude")
    lng: float = Field(description="Longitude")


class LocationAnalysisResponse(CamelCaseModel):
    """Complete location analysis response with dual-case field names"""
    coordinates: CoordinatesInfo
    geomagnetic: GeomagneticInfo
    storm_impact: StormImpactInfo
    timezone: Optional[TimezoneInfo] = None


# ============================================================================
# API Endpoints
# ============================================================================

@router.post("/location")
async def analyze_location(request: LocationRequest):
    """
    Get geomagnetic impact analysis for coordinates.

    Analyzes the given coordinates and returns:
    - Geomagnetic latitude and magnetic declination
    - Storm impact factor and aurora likelihood
    - Timezone information (if Google Maps API is configured)

    All response fields are provided in both snake_case and camelCase formats.

    Request Body:
        lat: Latitude (-90 to 90)
        lng: Longitude (-180 to 180)

    Returns:
        Standardized API response with location analysis data
    """
    try:
        lat, lng = request.lat, request.lng

        # Calculate geomagnetic properties
        geomag_lat = calculate_geomagnetic_latitude(lat, lng)
        declination = approximate_magnetic_declination(lat, lng)
        storm_impact = get_storm_impact_factor(lat, lng)

        # Build response data
        analysis_data = {
            "coordinates": {
                "lat": lat,
                "lng": lng
            },
            "geomagnetic": {
                "latitude": geomag_lat,
                "declination": declination
            },
            "storm_impact": {
                "factor": storm_impact.factor,
                "description": storm_impact.description,
                "aurora_likelihood": storm_impact.aurora_likelihood
            }
        }

        # Get timezone if Google Maps is configured
        if is_google_maps_configured():
            tz_result = await get_timezone(lat, lng)
            if tz_result.success and tz_result.timezone_id:
                analysis_data["timezone"] = {
                    "id": tz_result.timezone_id,
                    "name": tz_result.timezone_name or tz_result.timezone_id,
                    "utc_offset": (tz_result.raw_offset or 0) + (tz_result.dst_offset or 0)
                }

        return success_response(
            data=analysis_data,
            cached=False,  # Calculations are computed on-demand
            source="heliometric"
        )

    except ValueError as e:
        return JSONResponse(
            status_code=400,
            content=error_response(
                code=ErrorCodes.VALIDATION_ERROR,
                message=str(e),
                status_code=400
            )
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content=error_response(
                code=ErrorCodes.INTERNAL_ERROR,
                message="Failed to analyze location",
                status_code=500,
                details={"error": str(e)}
            )
        )


@router.get("/location")
async def location_info():
    """
    Get endpoint information and configuration status.

    Returns information about the location analysis endpoint
    including whether timezone lookup is available.
    """
    return success_response(
        data={
            "endpoint": "POST /api/location",
            "method": "POST",
            "body": {
                "lat": "number (required, -90 to 90)",
                "lng": "number (required, -180 to 180)"
            },
            "description": "Get geomagnetic impact analysis for coordinates",
            "timezone_available": is_google_maps_configured(),
            "features": [
                "geomagnetic_latitude",
                "magnetic_declination",
                "storm_impact_factor",
                "aurora_likelihood",
                "timezone_lookup"
            ]
        },
        source="documentation"
    )
