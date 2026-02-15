"""
NOAA Space Weather API Router
Provides NOAA K-Index data with standardized API responses
"""

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from services.noaa import (
    fetch_kindex,
    get_kindex_description,
    get_kindex_color
)
from utils.responses import (
    success_response,
    error_response,
    ErrorCodes
)

router = APIRouter()


@router.get("/noaa")
async def get_noaa_data():
    """
    Get current NOAA K-Index data.

    Returns latest readings, averages, storm status with both snake_case and camelCase fields.

    Response includes:
    - latest: Most recent K-Index reading
    - readings: Array of recent readings
    - average_kp/averageKp: Average K-Index value
    - max_kp/maxKp: Maximum K-Index value
    - status: Storm status (quiet/unsettled/storm)
    - description: Human-readable storm description
    - color: UI color code for visualization
    - is_simulated/isSimulated: True if using mock data
    """
    try:
        data = await fetch_kindex()

        if not data:
            return JSONResponse(
                status_code=503,
                content=error_response(
                    code=ErrorCodes.EXTERNAL_API_ERROR,
                    message="Unable to fetch NOAA data",
                    status_code=503
                )
            )

        # Add description and color for the latest reading
        if "latest" in data:
            kp = data["latest"]["kp_index"]
            data["description"] = get_kindex_description(kp)
            data["color"] = get_kindex_color(kp)

        # Check if data is cached (simulated data indicates no cache or API failure)
        is_cached = not data.get("is_simulated", False)

        return success_response(
            data=data,
            cached=is_cached,
            source="noaa_swpc"
        )

    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"NOAA data error: {e}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content=error_response(
                code=ErrorCodes.INTERNAL_ERROR,
                message="Failed to process NOAA data",
                status_code=500,
            )
        )


@router.get("/noaa/description/{kp_value}")
async def get_kp_description(kp_value: float):
    """
    Get description for a specific K-Index value.

    Args:
        kp_value: K-Index value (0-9)

    Returns:
        Description and color for the K-Index value
    """
    # Validate input range
    if kp_value < 0 or kp_value > 9:
        return JSONResponse(
            status_code=400,
            content=error_response(
                code=ErrorCodes.VALIDATION_ERROR,
                message="K-Index value must be between 0 and 9",
                status_code=400,
                field="kp_value"
            )
        )

    return success_response(
        data={
            "kp_index": kp_value,
            "description": get_kindex_description(kp_value),
            "color": get_kindex_color(kp_value)
        },
        cached=False,
        source="computed"
    )
