"""
Redis Cache Service
Provides caching for NOAA data and geocoding results
"""

import os
import json
import logging
from typing import TypeVar, Optional, Callable, Any
import redis

logger = logging.getLogger(__name__)

T = TypeVar('T')

# Lazy initialization
_redis_client: Optional[redis.Redis] = None


def get_redis_client() -> Optional[redis.Redis]:
    """Get Redis client instance (singleton pattern)"""
    global _redis_client

    if _redis_client is not None:
        return _redis_client

    redis_url = os.getenv("UPSTASH_REDIS_REST_URL")
    redis_token = os.getenv("UPSTASH_REDIS_REST_TOKEN")

    # Try Upstash REST format
    if redis_url and redis_token:
        # Convert Upstash REST URL to standard Redis URL
        # Upstash REST: https://xxx.upstash.io
        # We need: rediss://default:token@xxx.upstash.io:6379
        try:
            host = redis_url.replace("https://", "").replace("http://", "")
            _redis_client = redis.Redis(
                host=host,
                port=6379,
                password=redis_token,
                ssl=True,
                decode_responses=True
            )
            _redis_client.ping()
            logger.info("Redis connected successfully")
            return _redis_client
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}")
            return None

    # Try standard REDIS_URL
    standard_url = os.getenv("REDIS_URL")
    if standard_url:
        try:
            _redis_client = redis.from_url(standard_url, decode_responses=True)
            _redis_client.ping()
            logger.info("Redis connected successfully")
            return _redis_client
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}")
            return None

    logger.info("Redis not configured: No Redis URL provided")
    return None


class CacheKeys:
    """Cache keys used throughout the application"""
    NOAA_KINDEX = "noaa:kindex:latest"
    NOAA_KINDEX_HISTORY = "noaa:kindex:history"
    GEOCODE_PREFIX = "geocode:"
    SOLAR_TERMS = "astronomy:solar_terms:"
    ZODIAC_CALC = "zodiac:calc:"


class CacheTTL:
    """Cache TTLs in seconds"""
    NOAA_DATA = 300          # 5 minutes
    GEOCODE = 86400 * 30     # 30 days
    SOLAR_TERMS = 86400      # 1 day
    ZODIAC = 86400 * 365     # 1 year


async def get_cached(key: str) -> Optional[Any]:
    """Get cached value"""
    client = get_redis_client()
    if not client:
        return None

    try:
        value = client.get(key)
        if value:
            return json.loads(value)
        return None
    except Exception as e:
        logger.warning(f"Redis GET error for key {key}: {e}")
        return None


async def set_cached(key: str, value: Any, ttl_seconds: int) -> bool:
    """Set cached value with TTL"""
    client = get_redis_client()
    if not client:
        return False

    try:
        client.setex(key, ttl_seconds, json.dumps(value, default=str))
        return True
    except Exception as e:
        logger.warning(f"Redis SET error for key {key}: {e}")
        return False


async def get_or_compute(
    key: str,
    compute_fn: Callable[[], Any],
    ttl_seconds: int
) -> Any:
    """Get from cache or compute and store"""
    cached = await get_cached(key)
    if cached is not None:
        return cached

    # Compute fresh value
    value = await compute_fn() if callable(compute_fn) else compute_fn

    # Store in cache
    await set_cached(key, value, ttl_seconds)

    return value
