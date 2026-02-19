/**
 * Google Maps Geocoding Service
 * Provides location-based features for correlating heliospheric data with geography
 */

import { getCached, setCached, CacheKeys, CacheTTL } from './redis';

export interface GeoLocation {
  lat: number;
  lng: number;
  formattedAddress: string;
  placeId: string;
  timezone?: string;
  magneticDeclination?: number;
}

export interface GeocodeResult {
  success: boolean;
  location?: GeoLocation;
  error?: string;
  cached?: boolean;
}

export interface TimezoneResult {
  success: boolean;
  timezoneId?: string;
  timezoneName?: string;
  rawOffset?: number;
  dstOffset?: number;
  error?: string;
}

/**
 * Check if Google Maps API is configured
 */
export function isGoogleMapsConfigured(): boolean {
  return !!process.env.GOOGLE_MAPS_API_KEY;
}

/**
 * Geocode an address to coordinates
 * Results are cached in Redis for 30 days
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: 'Google Maps API key not configured',
    };
  }

  // Normalize address for cache key
  const cacheKey = `${CacheKeys.GEOCODE_PREFIX}${address.toLowerCase().trim()}`;

  // Check cache first
  const cached = await getCached<GeoLocation>(cacheKey);
  if (cached) {
    return {
      success: true,
      location: cached,
      cached: true,
    };
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('address', address);
    url.searchParams.set('key', apiKey);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const response = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      return {
        success: false,
        error: 'Geocoding service returned an error',
      };
    }

    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      return {
        success: false,
        error: data.status === 'ZERO_RESULTS'
          ? 'No results found for this address'
          : `Geocoding failed: ${data.status}`,
      };
    }

    const result = data.results[0];
    const location: GeoLocation = {
      lat: result.geometry?.location?.lat,
      lng: result.geometry?.location?.lng,
      formattedAddress: result.formatted_address,
      placeId: result.place_id,
    };

    // Cache the result
    await setCached(cacheKey, location, CacheTTL.GEOCODE);

    return {
      success: true,
      location,
      cached: false,
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return {
      success: false,
      error: 'Geocoding request failed',
    };
  }
}

/**
 * Get timezone for coordinates
 * Useful for calculating local solar noon and temporal correlations
 */
export async function getTimezone(
  lat: number,
  lng: number,
  timestamp?: number
): Promise<TimezoneResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: 'Google Maps API key not configured',
    };
  }

  try {
    const ts = timestamp || Math.floor(Date.now() / 1000);
    const url = new URL('https://maps.googleapis.com/maps/api/timezone/json');
    url.searchParams.set('location', `${lat},${lng}`);
    url.searchParams.set('timestamp', ts.toString());
    url.searchParams.set('key', apiKey);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const response = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      return {
        success: false,
        error: 'Timezone service returned an error',
      };
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      return {
        success: false,
        error: `Timezone lookup failed: ${data.status}`,
      };
    }

    return {
      success: true,
      timezoneId: data.timeZoneId,
      timezoneName: data.timeZoneName,
      rawOffset: data.rawOffset,
      dstOffset: data.dstOffset,
    };
  } catch (error) {
    console.error('Timezone lookup error:', error);
    return {
      success: false,
      error: 'Timezone lookup failed',
    };
  }
}

/**
 * Calculate magnetic declination approximation for a location
 * This affects how geomagnetic storms impact different regions
 * Note: For more accurate values, use NOAA's magnetic declination calculator
 */
export function approximateMagneticDeclination(lat: number, lng: number): number {
  // Simplified IGRF model approximation
  // Actual declination varies with time and requires full IGRF coefficients
  // This provides a rough estimate for display purposes
  const baseDeclination = -5 + (lng / 30);
  const latFactor = Math.sin(lat * Math.PI / 180) * 10;
  return Math.round((baseDeclination + latFactor) * 10) / 10;
}

/**
 * Calculate geomagnetic latitude
 * Locations at higher geomagnetic latitudes experience stronger aurora
 * and more intense geomagnetic storm effects
 */
export function calculateGeomagneticLatitude(lat: number, lng: number): number {
  // Geomagnetic pole coordinates (approximate, shifts over time)
  const poleLatN = 80.65; // North geomagnetic pole latitude
  const poleLngN = -72.68; // North geomagnetic pole longitude

  // Convert to radians
  const latRad = lat * Math.PI / 180;
  const lngRad = lng * Math.PI / 180;
  const poleLatRad = poleLatN * Math.PI / 180;
  const poleLngRad = poleLngN * Math.PI / 180;

  // Calculate geomagnetic latitude using spherical trigonometry
  const geomagLat = Math.asin(
    Math.sin(latRad) * Math.sin(poleLatRad) +
    Math.cos(latRad) * Math.cos(poleLatRad) * Math.cos(lngRad - poleLngRad)
  );

  return Math.round(geomagLat * 180 / Math.PI * 10) / 10;
}

/**
 * Get storm impact factor based on location
 * Higher geomagnetic latitudes experience stronger effects
 */
export function getStormImpactFactor(lat: number, lng: number): {
  factor: number;
  description: string;
  auroraLikelihood: 'none' | 'rare' | 'possible' | 'likely' | 'very_likely';
} {
  const geomagLat = calculateGeomagneticLatitude(lat, lng);
  const absGeomagLat = Math.abs(geomagLat);

  if (absGeomagLat >= 65) {
    return {
      factor: 1.5,
      description: 'Auroral zone - Strong geomagnetic effects',
      auroraLikelihood: 'very_likely',
    };
  } else if (absGeomagLat >= 55) {
    return {
      factor: 1.25,
      description: 'Sub-auroral zone - Enhanced effects during storms',
      auroraLikelihood: 'likely',
    };
  } else if (absGeomagLat >= 45) {
    return {
      factor: 1.0,
      description: 'Mid-latitude - Moderate storm effects',
      auroraLikelihood: 'possible',
    };
  } else if (absGeomagLat >= 30) {
    return {
      factor: 0.75,
      description: 'Sub-tropical - Reduced direct effects',
      auroraLikelihood: 'rare',
    };
  } else {
    return {
      factor: 0.5,
      description: 'Equatorial - Minimal direct geomagnetic effects',
      auroraLikelihood: 'none',
    };
  }
}
