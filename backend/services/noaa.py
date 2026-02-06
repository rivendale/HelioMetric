"""
NOAA Space Weather K-Index API Integration
Fetches real-time geomagnetic activity data with Redis caching

K-Index Scale (0-9):
0-4: Quiet to unsettled
5: Minor storm
6: Moderate storm
7: Strong storm
8: Severe storm
9: Extreme storm

All response models include both snake_case and camelCase field aliases.
"""

import math
import random
import logging
from datetime import datetime
from typing import List, Literal, Optional
import httpx
from pydantic import BaseModel, Field, ConfigDict
from pydantic.alias_generators import to_camel

from services.redis_cache import get_or_compute, CacheKeys, CacheTTL

logger = logging.getLogger(__name__)


class DualCaseModel(BaseModel):
    """Base model providing both snake_case and camelCase field names"""
    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=to_camel,
    )

    def model_dump_dual(self, **kwargs) -> dict:
        """Dump model with both snake_case and camelCase fields"""
        snake_dict = self.model_dump(by_alias=False, **kwargs)
        result = {}
        for key, value in snake_dict.items():
            result[key] = value
            # Add camelCase alias
            camel_key = ''.join(
                word.capitalize() if i > 0 else word
                for i, word in enumerate(key.split('_'))
            )
            if camel_key != key:
                result[camel_key] = value
        return result


class KIndexReading(DualCaseModel):
    """Single K-Index reading with dual-case field names"""
    time_tag: str = Field(description="Timestamp from NOAA")
    kp_index: float = Field(description="K-Index value (0-9)")
    observed_time: datetime = Field(description="Parsed observation time")


class NOAASpaceWeatherData(DualCaseModel):
    """Complete NOAA space weather response with dual-case field names"""
    latest: KIndexReading = Field(description="Most recent K-Index reading")
    readings: List[KIndexReading] = Field(description="Array of recent readings")
    average_kp: float = Field(description="Average K-Index value")
    max_kp: float = Field(description="Maximum K-Index value")
    status: Literal["quiet", "unsettled", "storm"] = Field(description="Storm status")
    is_simulated: bool = Field(default=False, description="True if using mock data")


def get_storm_status(kp: float) -> Literal["quiet", "unsettled", "storm"]:
    """Determine storm status from K-Index value"""
    if kp >= 5:
        return "storm"
    if kp >= 4:
        return "unsettled"
    return "quiet"


def get_kindex_description(kp: float) -> str:
    """Get human-readable K-Index description"""
    if kp >= 9:
        return "Extreme Geomagnetic Storm (G5)"
    if kp >= 8:
        return "Severe Geomagnetic Storm (G4)"
    if kp >= 7:
        return "Strong Geomagnetic Storm (G3)"
    if kp >= 6:
        return "Moderate Geomagnetic Storm (G2)"
    if kp >= 5:
        return "Minor Geomagnetic Storm (G1)"
    if kp >= 4:
        return "Unsettled Conditions"
    return "Quiet Conditions"


def get_kindex_color(kp: float) -> str:
    """Get color code for K-Index visualization"""
    if kp >= 8:
        return "#dc2626"  # red-600
    if kp >= 7:
        return "#ea580c"  # orange-600
    if kp >= 6:
        return "#f59e0b"  # amber-500
    if kp >= 5:
        return "#eab308"  # yellow-500
    if kp >= 4:
        return "#84cc16"  # lime-500
    return "#10b981"  # emerald-500


def get_mock_kindex_data() -> dict:
    """Generate mock data for development and error fallback"""
    now = datetime.utcnow()
    mock_readings = []

    for i in range(24):
        time_offset_ms = (23 - i) * 15 * 60 * 1000
        timestamp = datetime.fromtimestamp(now.timestamp() - time_offset_ms / 1000)

        # Simulate varying K-Index with some randomness
        base_kp = 3 + math.sin(i / 4) * 2
        kp_index = max(0, min(9, base_kp + (random.random() - 0.5)))

        mock_readings.append({
            "time_tag": timestamp.isoformat(),
            "kp_index": round(kp_index, 1),
            "observed_time": timestamp.isoformat()
        })

    latest = mock_readings[-1]
    avg_kp = sum(r["kp_index"] for r in mock_readings) / len(mock_readings)
    max_kp = max(r["kp_index"] for r in mock_readings)

    return {
        "latest": latest,
        "readings": mock_readings,
        "average_kp": round(avg_kp, 2),
        "max_kp": max_kp,
        "status": get_storm_status(latest["kp_index"]),
        "is_simulated": True
    }


async def fetch_kindex_from_api() -> dict:
    """Direct API fetch from NOAA"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json",
                headers={"Accept": "application/json"},
                timeout=10.0
            )
            response.raise_for_status()
            data = response.json()

        if not isinstance(data, list):
            raise ValueError("Invalid response format from NOAA API")

        # Skip header row and parse readings
        readings = []
        for row in data[1:]:
            if len(row) >= 2 and row[1] is not None:
                try:
                    kp_value = float(row[1])
                    observed_time = datetime.fromisoformat(row[0].replace("Z", "+00:00").replace(" ", "T"))
                    readings.append({
                        "time_tag": row[0],
                        "kp_index": kp_value,
                        "observed_time": observed_time.isoformat()
                    })
                except (ValueError, IndexError):
                    continue

        if not readings:
            raise ValueError("No valid K-Index readings available from NOAA")

        # Sort by time descending
        readings.sort(key=lambda x: x["observed_time"], reverse=True)

        latest = readings[0]
        valid_kp_values = [r["kp_index"] for r in readings if not math.isnan(r["kp_index"])]
        if not valid_kp_values:
            raise ValueError("All K-Index readings are NaN")
        average_kp = sum(valid_kp_values) / len(valid_kp_values)
        max_kp = max(valid_kp_values)

        return {
            "latest": latest,
            "readings": readings[:24],  # Last 24 readings
            "average_kp": round(average_kp, 2),
            "max_kp": max_kp,
            "status": get_storm_status(latest["kp_index"]),
            "is_simulated": False
        }

    except Exception as e:
        logger.warning(f"Error fetching K-Index from NOAA: {e}")
        return get_mock_kindex_data()


async def fetch_kindex() -> dict:
    """Fetch K-Index with Redis caching"""
    return await get_or_compute(
        CacheKeys.NOAA_KINDEX,
        fetch_kindex_from_api,
        CacheTTL.NOAA_DATA
    )
