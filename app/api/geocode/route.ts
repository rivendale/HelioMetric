/**
 * Geocoding API Route
 * POST /api/geocode - Convert address to coordinates
 */

import { NextRequest, NextResponse } from 'next/server';
import { geocodeAddress, isGoogleMapsConfigured } from '@/lib/maps';

export async function POST(request: NextRequest) {
  try {
    if (!isGoogleMapsConfigured()) {
      return NextResponse.json(
        { error: 'Geocoding service not available' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { address } = body;

    if (!address || typeof address !== 'string') {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    const result = await geocodeAddress(address);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      );
    }

    return NextResponse.json({
      location: result.location,
      cached: result.cached,
    });
  } catch (error) {
    console.error('Geocode API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    available: isGoogleMapsConfigured(),
    endpoint: 'POST /api/geocode',
    body: { address: 'string' },
  });
}
