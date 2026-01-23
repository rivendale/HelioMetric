"""
Location Analysis API Router
POST /api/location - Get geomagnetic impact analysis for coordinates
"""

from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.maps import (
    calculate_geomagnetic_latitude,
    approximate_magnetic_declination,
    get_storm_impact_factor,
    get_timezone,
    is_google_maps_configured
)

router = APIRouter()


class LocationRequest(BaseModel):
    """Location analysis request body"""
    lat: float
    lng: float


class TimezoneInfo(BaseModel):
    """Timezone information"""
    id: str
    name: str
    utc_offset: int


class GeomagneticInfo(BaseModel):
    """Geomagnetic properties"""
    latitude: float
    declination: float


class StormImpactInfo(BaseModel):
    """Storm impact analysis"""
    factor: float
    description: str
    aurora_likelihood: str


class LocationAnalysis(BaseModel):
    """Complete location analysis response"""
    coordinates: dict
    geomagnetic: GeomagneticInfo
    storm_impact: StormImpactInfo
    timezone: Optional[TimezoneInfo] = None


@router.post("/location", response_model=LocationAnalysis)
async def analyze_location(request: LocationRequest):
    """
    Get geomagnetic impact analysis for coordinates
    """
    lat, lng = request.lat, request.lng

    # Validate coordinates
    if lat < -90 or lat > 90 or lng < -180 or lng > 180:
        raise HTTPException(
            status_code=400,
            detail="Coordinates out of valid range"
        )

    # Calculate geomagnetic properties
    geomag_lat = calculate_geomagnetic_latitude(lat, lng)
    declination = approximate_magnetic_declination(lat, lng)
    storm_impact = get_storm_impact_factor(lat, lng)

    analysis = LocationAnalysis(
        coordinates={"lat": lat, "lng": lng},
        geomagnetic=GeomagneticInfo(
            latitude=geomag_lat,
            declination=declination
        ),
        storm_impact=StormImpactInfo(
            factor=storm_impact.factor,
            description=storm_impact.description,
            aurora_likelihood=storm_impact.aurora_likelihood
        )
    )

    # Get timezone if Google Maps is configured
    if is_google_maps_configured():
        tz_result = await get_timezone(lat, lng)
        if tz_result.success and tz_result.timezone_id:
            analysis.timezone = TimezoneInfo(
                id=tz_result.timezone_id,
                name=tz_result.timezone_name or tz_result.timezone_id,
                utc_offset=(tz_result.raw_offset or 0) + (tz_result.dst_offset or 0)
            )

    return analysis


@router.get("/location")
async def location_info():
    """Get endpoint information"""
    return {
        "endpoint": "POST /api/location",
        "body": {"lat": "number", "lng": "number"},
        "description": "Get geomagnetic impact analysis for coordinates"
    }
