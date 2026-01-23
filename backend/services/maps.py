"""
Google Maps Geocoding Service
Provides location-based features for correlating heliospheric data with geography
"""

import os
import math
from typing import Optional, Literal
import httpx
from pydantic import BaseModel

from services.redis_cache import get_cached, set_cached, CacheKeys, CacheTTL


class GeoLocation(BaseModel):
    """Geocoded location data"""
    lat: float
    lng: float
    formatted_address: str
    place_id: str
    timezone: Optional[str] = None
    magnetic_declination: Optional[float] = None


class GeocodeResult(BaseModel):
    """Geocoding result"""
    success: bool
    location: Optional[GeoLocation] = None
    error: Optional[str] = None
    cached: bool = False


class TimezoneResult(BaseModel):
    """Timezone lookup result"""
    success: bool
    timezone_id: Optional[str] = None
    timezone_name: Optional[str] = None
    raw_offset: Optional[int] = None
    dst_offset: Optional[int] = None
    error: Optional[str] = None


class StormImpact(BaseModel):
    """Storm impact analysis for a location"""
    factor: float
    description: str
    aurora_likelihood: Literal["none", "rare", "possible", "likely", "very_likely"]


def is_google_maps_configured() -> bool:
    """Check if Google Maps API is configured"""
    return bool(os.getenv("GOOGLE_MAPS_API_KEY"))


def approximate_magnetic_declination(lat: float, lng: float) -> float:
    """
    Calculate magnetic declination approximation for a location
    Note: For more accurate values, use NOAA's magnetic declination calculator
    """
    # Simplified IGRF model approximation
    base_declination = -5 + (lng / 30)
    lat_factor = math.sin(lat * math.pi / 180) * 10
    return round((base_declination + lat_factor), 1)


def calculate_geomagnetic_latitude(lat: float, lng: float) -> float:
    """
    Calculate geomagnetic latitude
    Locations at higher geomagnetic latitudes experience stronger aurora
    and more intense geomagnetic storm effects
    """
    # Geomagnetic pole coordinates (approximate)
    pole_lat_n = 80.65  # North geomagnetic pole latitude
    pole_lng_n = -72.68  # North geomagnetic pole longitude

    # Convert to radians
    lat_rad = lat * math.pi / 180
    lng_rad = lng * math.pi / 180
    pole_lat_rad = pole_lat_n * math.pi / 180
    pole_lng_rad = pole_lng_n * math.pi / 180

    # Calculate geomagnetic latitude using spherical trigonometry
    geomag_lat = math.asin(
        math.sin(lat_rad) * math.sin(pole_lat_rad) +
        math.cos(lat_rad) * math.cos(pole_lat_rad) * math.cos(lng_rad - pole_lng_rad)
    )

    return round(geomag_lat * 180 / math.pi, 1)


def get_storm_impact_factor(lat: float, lng: float) -> StormImpact:
    """
    Get storm impact factor based on location
    Higher geomagnetic latitudes experience stronger effects
    """
    geomag_lat = calculate_geomagnetic_latitude(lat, lng)
    abs_geomag_lat = abs(geomag_lat)

    if abs_geomag_lat >= 65:
        return StormImpact(
            factor=1.5,
            description="Auroral zone - Strong geomagnetic effects",
            aurora_likelihood="very_likely"
        )
    elif abs_geomag_lat >= 55:
        return StormImpact(
            factor=1.25,
            description="Sub-auroral zone - Enhanced effects during storms",
            aurora_likelihood="likely"
        )
    elif abs_geomag_lat >= 45:
        return StormImpact(
            factor=1.0,
            description="Mid-latitude - Moderate storm effects",
            aurora_likelihood="possible"
        )
    elif abs_geomag_lat >= 30:
        return StormImpact(
            factor=0.75,
            description="Sub-tropical - Reduced direct effects",
            aurora_likelihood="rare"
        )
    else:
        return StormImpact(
            factor=0.5,
            description="Equatorial - Minimal direct geomagnetic effects",
            aurora_likelihood="none"
        )


async def geocode_address(address: str) -> GeocodeResult:
    """Geocode an address to coordinates with Redis caching"""
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")

    if not api_key:
        return GeocodeResult(
            success=False,
            error="Google Maps API key not configured"
        )

    # Normalize address for cache key
    cache_key = f"{CacheKeys.GEOCODE_PREFIX}{address.lower().strip()}"

    # Check cache first
    cached = await get_cached(cache_key)
    if cached:
        return GeocodeResult(
            success=True,
            location=GeoLocation(**cached),
            cached=True
        )

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://maps.googleapis.com/maps/api/geocode/json",
                params={"address": address, "key": api_key},
                timeout=10.0
            )
            response.raise_for_status()
            data = response.json()

        if data.get("status") != "OK" or not data.get("results"):
            return GeocodeResult(
                success=False,
                error="No results found for this address" if data.get("status") == "ZERO_RESULTS"
                      else f"Geocoding failed: {data.get('status')}"
            )

        result = data["results"][0]
        location = GeoLocation(
            lat=result["geometry"]["location"]["lat"],
            lng=result["geometry"]["location"]["lng"],
            formatted_address=result["formatted_address"],
            place_id=result["place_id"]
        )

        # Cache the result
        await set_cached(cache_key, location.model_dump(), CacheTTL.GEOCODE)

        return GeocodeResult(
            success=True,
            location=location,
            cached=False
        )

    except Exception as e:
        print(f"Geocoding error: {e}")
        return GeocodeResult(
            success=False,
            error=str(e)
        )


async def get_timezone(lat: float, lng: float, timestamp: Optional[int] = None) -> TimezoneResult:
    """Get timezone for coordinates"""
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")

    if not api_key:
        return TimezoneResult(
            success=False,
            error="Google Maps API key not configured"
        )

    try:
        import time
        ts = timestamp or int(time.time())

        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://maps.googleapis.com/maps/api/timezone/json",
                params={
                    "location": f"{lat},{lng}",
                    "timestamp": str(ts),
                    "key": api_key
                },
                timeout=10.0
            )
            response.raise_for_status()
            data = response.json()

        if data.get("status") != "OK":
            return TimezoneResult(
                success=False,
                error=f"Timezone lookup failed: {data.get('status')}"
            )

        return TimezoneResult(
            success=True,
            timezone_id=data.get("timeZoneId"),
            timezone_name=data.get("timeZoneName"),
            raw_offset=data.get("rawOffset"),
            dst_offset=data.get("dstOffset")
        )

    except Exception as e:
        print(f"Timezone lookup error: {e}")
        return TimezoneResult(
            success=False,
            error=str(e)
        )
