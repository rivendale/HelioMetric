"""
Geocoding API Router
POST /api/geocode - Convert address to coordinates
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.maps import geocode_address, is_google_maps_configured

router = APIRouter()


class GeocodeRequest(BaseModel):
    """Geocode request body"""
    address: str


@router.post("/geocode")
async def geocode(request: GeocodeRequest):
    """
    Convert address to coordinates
    """
    if not is_google_maps_configured():
        raise HTTPException(
            status_code=503,
            detail="Geocoding service not available"
        )

    if not request.address or not request.address.strip():
        raise HTTPException(
            status_code=400,
            detail="Address is required"
        )

    result = await geocode_address(request.address)

    if not result.success:
        raise HTTPException(
            status_code=404,
            detail=result.error
        )

    return {
        "location": result.location.model_dump() if result.location else None,
        "cached": result.cached
    }


@router.get("/geocode")
async def geocode_info():
    """Get endpoint information"""
    return {
        "available": is_google_maps_configured(),
        "endpoint": "POST /api/geocode",
        "body": {"address": "string"}
    }
