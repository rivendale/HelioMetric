'use client';

import React, { useState, useCallback } from 'react';
import { MapPin, Compass, Globe, Zap, Search, Loader2, AlertTriangle } from 'lucide-react';

export interface LocationData {
  lat: number;
  lng: number;
  formattedAddress?: string;
}

export interface GeomagneticAnalysis {
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

export interface LocationSensorProps {
  kIndex: number;
  onLocationChange?: (location: LocationData | null) => void;
}

// Aurora likelihood colors
const AURORA_COLORS: Record<string, { text: string; bg: string }> = {
  none: { text: 'text-gray-400', bg: 'bg-gray-900/50' },
  rare: { text: 'text-blue-400', bg: 'bg-blue-950/30' },
  possible: { text: 'text-cyan-400', bg: 'bg-cyan-950/30' },
  likely: { text: 'text-green-400', bg: 'bg-green-950/30' },
  very_likely: { text: 'text-purple-400', bg: 'bg-purple-950/30' },
};

// Impact factor colors
function getImpactColor(factor: number): string {
  if (factor >= 1.25) return 'text-red-400';
  if (factor >= 1.0) return 'text-orange-400';
  if (factor >= 0.75) return 'text-yellow-400';
  return 'text-green-400';
}

// Calculate effective K-index based on location
function getEffectiveKIndex(kIndex: number, impactFactor: number): number {
  return Math.min(9, Math.round(kIndex * impactFactor * 10) / 10);
}

export function LocationSensor({ kIndex, onLocationChange }: LocationSensorProps) {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [analysis, setAnalysis] = useState<GeomagneticAnalysis | null>(null);

  // Geocode address
  const handleSearch = useCallback(async () => {
    if (!address.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // First geocode the address
      const geocodeRes = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });

      if (!geocodeRes.ok) {
        const data = await geocodeRes.json();
        throw new Error(data.error || 'Failed to geocode address');
      }

      const geocodeData = await geocodeRes.json();
      const newLocation: LocationData = {
        lat: geocodeData.location.lat,
        lng: geocodeData.location.lng,
        formattedAddress: geocodeData.location.formattedAddress,
      };

      setLocation(newLocation);
      onLocationChange?.(newLocation);

      // Then get geomagnetic analysis
      const analysisRes = await fetch('/api/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: newLocation.lat, lng: newLocation.lng }),
      });

      if (analysisRes.ok) {
        const analysisData = await analysisRes.json();
        setAnalysis(analysisData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLocation(null);
      setAnalysis(null);
      onLocationChange?.(null);
    } finally {
      setLoading(false);
    }
  }, [address, onLocationChange]);

  // Use browser geolocation
  const handleUseMyLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const newLocation: LocationData = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setLocation(newLocation);
        onLocationChange?.(newLocation);

        try {
          const analysisRes = await fetch('/api/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: newLocation.lat, lng: newLocation.lng }),
          });

          if (analysisRes.ok) {
            const analysisData = await analysisRes.json();
            setAnalysis(analysisData);
          }
        } catch {
          // Analysis is optional, don't set error
        }

        setLoading(false);
      },
      (err) => {
        setError(`Location error: ${err.message}`);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onLocationChange]);

  // Clear location
  const handleClear = useCallback(() => {
    setLocation(null);
    setAnalysis(null);
    setAddress('');
    setError(null);
    onLocationChange?.(null);
  }, [onLocationChange]);

  const effectiveKIndex = analysis
    ? getEffectiveKIndex(kIndex, analysis.stormImpact.factor)
    : kIndex;

  const auroraStyle = analysis
    ? AURORA_COLORS[analysis.stormImpact.auroraLikelihood] || AURORA_COLORS.none
    : AURORA_COLORS.none;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-cyan-400 font-[family-name:var(--font-geist-mono)] uppercase tracking-wide">
            Geomagnetic Location Sensor
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Storm impact varies by geographic position
          </p>
        </div>
        <Globe className="w-5 h-5 text-cyan-400/50" />
      </div>

      {/* Search Input */}
      <div className="mb-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter city or address..."
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyan-600"
              disabled={loading}
            />
            {loading && (
              <Loader2 className="absolute right-3 top-2.5 w-4 h-4 text-cyan-400 animate-spin" />
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !address.trim()}
            className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm rounded transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={handleUseMyLocation}
            disabled={loading}
            className="flex items-center gap-1 px-2 py-1 text-xs text-cyan-400 hover:text-cyan-300 disabled:text-gray-500"
          >
            <MapPin className="w-3 h-3" />
            Use my location
          </button>
          {location && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-gray-300"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 px-3 py-2 bg-red-950/30 border border-red-800/50 rounded flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="text-xs text-red-400">{error}</span>
        </div>
      )}

      {/* Location Display */}
      {location && (
        <div className="mb-4 px-3 py-2 bg-gray-800/50 rounded">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-cyan-400 mt-0.5" />
            <div>
              {location.formattedAddress ? (
                <span className="text-sm text-gray-200">{location.formattedAddress}</span>
              ) : (
                <span className="text-sm text-gray-400 font-mono">
                  {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-3">
          {/* Geomagnetic Latitude */}
          <div className="grid grid-cols-2 gap-3">
            <div className="px-3 py-2 bg-gray-800/50 rounded">
              <div className="flex items-center gap-2 mb-1">
                <Compass className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500 uppercase">Geomag. Latitude</span>
              </div>
              <span className="text-lg font-mono text-gray-100">
                {analysis.geomagnetic.latitude}°
              </span>
            </div>
            <div className="px-3 py-2 bg-gray-800/50 rounded">
              <div className="flex items-center gap-2 mb-1">
                <Compass className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500 uppercase">Declination</span>
              </div>
              <span className="text-lg font-mono text-gray-100">
                {analysis.geomagnetic.declination > 0 ? '+' : ''}{analysis.geomagnetic.declination}°
              </span>
            </div>
          </div>

          {/* Storm Impact */}
          <div className="px-3 py-3 bg-gray-800/30 border border-gray-700/50 rounded">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className={`w-4 h-4 ${getImpactColor(analysis.stormImpact.factor)}`} />
                <span className="text-xs text-gray-400 uppercase">Storm Impact Factor</span>
              </div>
              <span className={`text-lg font-mono font-bold ${getImpactColor(analysis.stormImpact.factor)}`}>
                {analysis.stormImpact.factor}x
              </span>
            </div>
            <p className="text-xs text-gray-400">{analysis.stormImpact.description}</p>

            {/* Effective K-Index */}
            <div className="mt-3 pt-3 border-t border-gray-700/50">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Effective Kp at your location</span>
                <span className={`font-mono font-bold ${
                  effectiveKIndex >= 7 ? 'text-red-400' :
                  effectiveKIndex >= 5 ? 'text-orange-400' :
                  effectiveKIndex >= 4 ? 'text-yellow-400' : 'text-green-400'
                }`}>
                  {effectiveKIndex.toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Aurora Likelihood */}
          <div className={`px-3 py-2 rounded ${auroraStyle.bg}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Aurora Likelihood</span>
              <span className={`text-sm font-semibold capitalize ${auroraStyle.text}`}>
                {analysis.stormImpact.auroraLikelihood.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Timezone */}
          {analysis.timezone && (
            <div className="px-3 py-2 bg-gray-800/30 rounded">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Local Timezone</span>
                <span className="text-xs text-gray-300">{analysis.timezone.name}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!location && !error && (
        <div className="py-6 text-center">
          <Globe className="w-8 h-8 text-gray-700 mx-auto mb-2" />
          <p className="text-xs text-gray-500">
            Enter a location to see geomagnetic impact analysis
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-gray-800">
        <p className="text-xs text-gray-600 text-center">
          Higher geomagnetic latitudes experience stronger storm effects
        </p>
      </div>
    </div>
  );
}

export default LocationSensor;
