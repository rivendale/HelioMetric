import { useState, useCallback } from 'react';
import { MapPin, Compass, Globe, Zap, Search, Loader2, AlertTriangle } from 'lucide-react';
import { analyzeLocation, geocodeAddress, type LocationAnalysis } from '@/api/client';

interface LocationData {
  lat: number;
  lng: number;
  formattedAddress?: string;
}

export interface LocationSensorProps {
  kIndex: number;
  onLocationChange?: (location: LocationData | null) => void;
}

const AURORA_COLORS: Record<string, { text: string; bg: string }> = {
  none: { text: 'text-slate-500', bg: 'bg-slate-50' },
  rare: { text: 'text-blue-600', bg: 'bg-blue-50' },
  possible: { text: 'text-cyan-600', bg: 'bg-cyan-50' },
  likely: { text: 'text-green-600', bg: 'bg-green-50' },
  very_likely: { text: 'text-purple-600', bg: 'bg-purple-50' },
};

function getImpactColor(factor: number): string {
  if (factor >= 1.25) return 'text-red-600';
  if (factor >= 1.0) return 'text-orange-500';
  if (factor >= 0.75) return 'text-amber-600';
  return 'text-green-600';
}

function getEffectiveKIndex(kIndex: number, impactFactor: number): number {
  return Math.min(9, Math.round(kIndex * impactFactor * 10) / 10);
}

export function LocationSensor({ kIndex, onLocationChange }: LocationSensorProps) {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [analysis, setAnalysis] = useState<LocationAnalysis | null>(null);

  const handleSearch = useCallback(async () => {
    if (!address.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const geocodeData = await geocodeAddress(address);
      if (!geocodeData.location) {
        throw new Error('Failed to geocode address');
      }

      const newLocation: LocationData = {
        lat: geocodeData.location.lat,
        lng: geocodeData.location.lng,
        formattedAddress: geocodeData.location.formatted_address,
      };

      setLocation(newLocation);
      onLocationChange?.(newLocation);

      const analysisData = await analyzeLocation(newLocation.lat, newLocation.lng);
      setAnalysis(analysisData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLocation(null);
      setAnalysis(null);
      onLocationChange?.(null);
    } finally {
      setLoading(false);
    }
  }, [address, onLocationChange]);

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
          const analysisData = await analyzeLocation(newLocation.lat, newLocation.lng);
          setAnalysis(analysisData);
        } catch {
          // Analysis is optional
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

  const handleClear = useCallback(() => {
    setLocation(null);
    setAnalysis(null);
    setAddress('');
    setError(null);
    onLocationChange?.(null);
  }, [onLocationChange]);

  const effectiveKIndex = analysis
    ? getEffectiveKIndex(kIndex, analysis.storm_impact.factor)
    : kIndex;

  const auroraStyle = analysis
    ? AURORA_COLORS[analysis.storm_impact.aurora_likelihood] || AURORA_COLORS.none
    : AURORA_COLORS.none;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Location Analysis</h3>
          <p className="text-xs text-slate-500 mt-0.5">Storm impact by geographic position</p>
        </div>
        <Globe className="w-5 h-5 text-blue-400" />
      </div>

      <div className="mb-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter city or address..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
            {loading && <Loader2 className="absolute right-3 top-2.5 w-4 h-4 text-blue-500 animate-spin" />}
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !address.trim()}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm rounded-lg transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={handleUseMyLocation}
            disabled={loading}
            className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 disabled:text-slate-400"
          >
            <MapPin className="w-3 h-3" />
            Use my location
          </button>
          {location && (
            <button onClick={handleClear} className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-slate-700">
              Clear
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="text-xs text-red-600">{error}</span>
        </div>
      )}

      {location && (
        <div className="mb-4 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-blue-500 mt-0.5" />
            <div>
              {location.formattedAddress ? (
                <span className="text-sm text-slate-700">{location.formattedAddress}</span>
              ) : (
                <span className="text-sm text-slate-500 font-mono">
                  {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {analysis && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center gap-2 mb-1">
                <Compass className="w-3 h-3 text-slate-400" />
                <span className="text-xs text-slate-500 uppercase">Geomag. Latitude</span>
              </div>
              <span className="text-lg font-semibold text-slate-800">{analysis.geomagnetic.latitude}°</span>
            </div>
            <div className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center gap-2 mb-1">
                <Compass className="w-3 h-3 text-slate-400" />
                <span className="text-xs text-slate-500 uppercase">Declination</span>
              </div>
              <span className="text-lg font-semibold text-slate-800">
                {analysis.geomagnetic.declination > 0 ? '+' : ''}{analysis.geomagnetic.declination}°
              </span>
            </div>
          </div>

          <div className="px-3 py-3 bg-slate-50 border border-slate-100 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className={`w-4 h-4 ${getImpactColor(analysis.storm_impact.factor)}`} />
                <span className="text-xs text-slate-500 uppercase">Storm Impact</span>
              </div>
              <span className={`text-lg font-bold ${getImpactColor(analysis.storm_impact.factor)}`}>
                {analysis.storm_impact.factor}x
              </span>
            </div>
            <p className="text-xs text-slate-600">{analysis.storm_impact.description}</p>

            <div className="mt-3 pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Effective Kp at your location</span>
                <span className={`font-semibold ${
                  effectiveKIndex >= 7 ? 'text-red-600' :
                  effectiveKIndex >= 5 ? 'text-orange-500' :
                  effectiveKIndex >= 4 ? 'text-amber-600' : 'text-green-600'
                }`}>
                  {effectiveKIndex.toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          <div className={`px-3 py-2 rounded-lg ${auroraStyle.bg}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Aurora Likelihood</span>
              <span className={`text-sm font-medium capitalize ${auroraStyle.text}`}>
                {analysis.storm_impact.aurora_likelihood.replace('_', ' ')}
              </span>
            </div>
          </div>

          {analysis.timezone && (
            <div className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Local Timezone</span>
                <span className="text-xs text-slate-700">{analysis.timezone.name}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {!location && !error && (
        <div className="py-6 text-center">
          <Globe className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500">Enter a location to see geomagnetic analysis</p>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-slate-100">
        <p className="text-xs text-slate-400 text-center">Higher latitudes experience stronger effects</p>
      </div>
    </div>
  );
}

export default LocationSensor;
