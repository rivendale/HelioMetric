/**
 * Location Analysis API Route
 * POST /api/location - Get geomagnetic impact analysis for coordinates
 *
 * Returns geomagnetic latitude, magnetic declination, storm impact analysis,
 * and optional timezone information. All fields are provided in both
 * snake_case and camelCase formats for client compatibility.
 */

import { NextRequest } from 'next/server';
import {
  getTimezone,
  getStormImpactFactor,
  calculateGeomagneticLatitude,
  approximateMagneticDeclination,
  isGoogleMapsConfigured,
} from '@/lib/maps';
import {
  successResponse,
  validationError,
  internalError,
  addDualCaseAliases,
} from '@/lib/api-utils';

// ============================================================================
// Type Definitions
// ============================================================================

export interface LocationAnalysis {
  coordinates: {
    lat: number;
    lng: number;
  };
  geomagnetic: {
    latitude: number;
    declination: number;
  };
  storm_impact: {
    factor: number;
    description: string;
    aurora_likelihood: string;
  };
  // camelCase aliases
  stormImpact?: {
    factor: number;
    description: string;
    auroraLikelihood: string;
  };
  timezone?: {
    id: string;
    name: string;
    utc_offset: number;
    utcOffset?: number;
  };
}

// ============================================================================
// API Handlers
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lat, lng } = body;

    // Type validation
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return validationError(
        'Valid lat and lng coordinates are required',
        'coordinates',
        { received: { lat: typeof lat, lng: typeof lng } }
      );
    }

    // Range validation
    if (lat < -90 || lat > 90) {
      return validationError(
        'Latitude must be between -90 and 90',
        'lat',
        { received: lat, valid_range: [-90, 90] }
      );
    }

    if (lng < -180 || lng > 180) {
      return validationError(
        'Longitude must be between -180 and 180',
        'lng',
        { received: lng, valid_range: [-180, 180] }
      );
    }

    // Calculate geomagnetic properties
    const geomagLat = calculateGeomagneticLatitude(lat, lng);
    const declination = approximateMagneticDeclination(lat, lng);
    const stormImpact = getStormImpactFactor(lat, lng);

    // Build analysis data with dual-case field names
    const analysisData: Record<string, unknown> = {
      coordinates: { lat, lng },
      geomagnetic: {
        latitude: geomagLat,
        declination,
      },
      storm_impact: {
        factor: stormImpact.factor,
        description: stormImpact.description,
        aurora_likelihood: stormImpact.auroraLikelihood,
      },
    };

    // Get timezone if Google Maps is configured
    if (isGoogleMapsConfigured()) {
      const tzResult = await getTimezone(lat, lng);
      if (tzResult.success && tzResult.timezoneId) {
        analysisData.timezone = {
          id: tzResult.timezoneId,
          name: tzResult.timezoneName || tzResult.timezoneId,
          utc_offset: (tzResult.rawOffset || 0) + (tzResult.dstOffset || 0),
        };
      }
    }

    // Add dual-case aliases and return
    return successResponse(addDualCaseAliases(analysisData), {
      cached: false,
      source: 'heliometric',
    });
  } catch (error) {
    console.error('Location analysis error:', error);
    return internalError('Failed to analyze location');
  }
}

export async function GET() {
  return successResponse(
    {
      endpoint: 'POST /api/location',
      method: 'POST',
      body: {
        lat: 'number (required, -90 to 90)',
        lng: 'number (required, -180 to 180)',
      },
      description: 'Get geomagnetic impact analysis for coordinates',
      timezone_available: isGoogleMapsConfigured(),
      response_format: 'Dual-case (snake_case and camelCase)',
      features: [
        'geomagnetic_latitude',
        'magnetic_declination',
        'storm_impact_factor',
        'aurora_likelihood',
        'timezone_lookup',
      ],
    },
    { source: 'documentation' }
  );
}
