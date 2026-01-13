/**
 * Location Analysis API Route
 * POST /api/location - Get geomagnetic impact analysis for coordinates
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getTimezone,
  getStormImpactFactor,
  calculateGeomagneticLatitude,
  approximateMagneticDeclination,
  isGoogleMapsConfigured,
} from '@/lib/maps';

export interface LocationAnalysis {
  coordinates: {
    lat: number;
    lng: number;
  };
  geomagnetic: {
    latitude: number;
    declination: number;
  };
  stormImpact: {
    factor: number;
    description: string;
    auroraLikelihood: string;
  };
  timezone?: {
    id: string;
    name: string;
    utcOffset: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lat, lng } = body;

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json(
        { error: 'Valid lat and lng coordinates are required' },
        { status: 400 }
      );
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: 'Coordinates out of valid range' },
        { status: 400 }
      );
    }

    // Calculate geomagnetic properties
    const geomagLat = calculateGeomagneticLatitude(lat, lng);
    const declination = approximateMagneticDeclination(lat, lng);
    const stormImpact = getStormImpactFactor(lat, lng);

    const analysis: LocationAnalysis = {
      coordinates: { lat, lng },
      geomagnetic: {
        latitude: geomagLat,
        declination,
      },
      stormImpact,
    };

    // Get timezone if Google Maps is configured
    if (isGoogleMapsConfigured()) {
      const tzResult = await getTimezone(lat, lng);
      if (tzResult.success && tzResult.timezoneId) {
        analysis.timezone = {
          id: tzResult.timezoneId,
          name: tzResult.timezoneName || tzResult.timezoneId,
          utcOffset: (tzResult.rawOffset || 0) + (tzResult.dstOffset || 0),
        };
      }
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Location analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'POST /api/location',
    body: { lat: 'number', lng: 'number' },
    description: 'Get geomagnetic impact analysis for coordinates',
  });
}
