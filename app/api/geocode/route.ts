/**
 * Geocoding API Route
 * POST /api/geocode - Convert address to coordinates
 *
 * Uses Google Maps Geocoding API with Redis caching.
 * All fields are provided in both snake_case and camelCase formats.
 */

import { NextRequest } from 'next/server';
import { geocodeAddress, isGoogleMapsConfigured } from '@/lib/maps';
import {
  successResponse,
  validationError,
  notFoundError,
  serviceUnavailableError,
  internalError,
  errorResponse,
  ErrorCodes,
  addDualCaseAliases,
} from '@/lib/api-utils';

// ============================================================================
// API Handlers
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Check if service is configured
    if (!isGoogleMapsConfigured()) {
      return serviceUnavailableError(
        'Geocoding service not available. Google Maps API key not configured.'
      );
    }

    const body = await request.json();
    const { address } = body;

    // Validate address
    if (!address || typeof address !== 'string') {
      return validationError(
        'Address is required and must be a string',
        'address',
        { received: typeof address }
      );
    }

    const trimmedAddress = address.trim();
    if (trimmedAddress.length < 3) {
      return validationError(
        'Address must be at least 3 characters',
        'address',
        { received_length: trimmedAddress.length, min_length: 3 }
      );
    }

    if (trimmedAddress.length > 500) {
      return validationError(
        'Address must be less than 500 characters',
        'address',
        { received_length: trimmedAddress.length, max_length: 500 }
      );
    }

    // Perform geocoding
    const result = await geocodeAddress(trimmedAddress);

    if (!result.success) {
      // Determine appropriate error response
      if (result.error?.includes('API')) {
        return errorResponse(ErrorCodes.EXTERNAL_API_ERROR, 'Geocoding service error', {
          status: 502,
        });
      }
      return notFoundError(
        result.error || 'No results found for this address'
      );
    }

    // Build response with dual-case fields
    const locationData = result.location
      ? addDualCaseAliases({
          lat: result.location.lat,
          lng: result.location.lng,
          formatted_address: result.location.formattedAddress,
          place_id: result.location.placeId,
          ...(result.location.timezone && { timezone: result.location.timezone }),
          ...(result.location.magneticDeclination !== undefined && {
            magnetic_declination: result.location.magneticDeclination,
          }),
        })
      : null;

    return successResponse(
      { location: locationData },
      {
        cached: result.cached,
        source: 'google_maps',
      }
    );
  } catch (error) {
    console.error('Geocode API error:', error);
    return internalError('Geocoding request failed');
  }
}

export async function GET() {
  const isAvailable = isGoogleMapsConfigured();

  return successResponse(
    addDualCaseAliases({
      available: isAvailable,
      endpoint: 'POST /api/geocode',
      method: 'POST',
      body: {
        address: 'string (required, 3-500 characters)',
      },
      description: 'Convert address to coordinates using Google Maps Geocoding API',
      caching: {
        enabled: true,
        ttl_days: 30,
        backend: 'redis',
      },
      response_fields: [
        'lat',
        'lng',
        'formatted_address / formattedAddress',
        'place_id / placeId',
        'timezone (optional)',
        'magnetic_declination / magneticDeclination (optional)',
      ],
      status: isAvailable ? 'operational' : 'unavailable',
    }),
    { source: 'documentation' }
  );
}
