"""
NOAA Space Weather API Router
"""

from fastapi import APIRouter
from services.noaa import (
    fetch_kindex,
    get_kindex_description,
    get_kindex_color
)

router = APIRouter()


@router.get("/noaa")
async def get_noaa_data():
    """
    Get current NOAA K-Index data
    Returns latest readings, averages, and storm status
    """
    data = await fetch_kindex()

    # Add description and color for the latest reading
    if data and "latest" in data:
        kp = data["latest"]["kp_index"]
        data["description"] = get_kindex_description(kp)
        data["color"] = get_kindex_color(kp)

    return data


@router.get("/noaa/description/{kp_value}")
async def get_kp_description(kp_value: float):
    """Get description for a specific K-Index value"""
    return {
        "kp_index": kp_value,
        "description": get_kindex_description(kp_value),
        "color": get_kindex_color(kp_value)
    }
