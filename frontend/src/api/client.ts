/**
 * API Client for HelioMetric Backend
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * NOAA K-Index reading
 */
export interface KIndexReading {
  time_tag: string;
  kp_index: number;
  observed_time: string;
}

/**
 * NOAA Space Weather Data
 */
export interface NOAASpaceWeatherData {
  latest: KIndexReading;
  readings: KIndexReading[];
  average_kp: number;
  max_kp: number;
  status: 'quiet' | 'unsettled' | 'storm';
  is_simulated: boolean;
  description?: string;
  color?: string;
}

/**
 * Location Analysis Response
 */
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
  timezone?: {
    id: string;
    name: string;
    utc_offset: number;
  };
}

/**
 * Geocode Response
 */
export interface GeocodeResponse {
  location: {
    lat: number;
    lng: number;
    formatted_address: string;
    place_id: string;
  } | null;
  cached: boolean;
}

/**
 * Fetch NOAA K-Index data
 */
export async function fetchNOAAData(): Promise<NOAASpaceWeatherData> {
  const response = await fetch(`${API_BASE}/noaa`);
  if (!response.ok) {
    throw new Error(`Failed to fetch NOAA data: ${response.statusText}`);
  }
  const json = await response.json();
  // API returns { success, data, meta } envelope — unwrap the data
  const data = json.data ?? json;
  if (!data.latest) {
    throw new Error('Invalid NOAA response: missing latest reading');
  }
  return data;
}

/**
 * Analyze location for geomagnetic impact
 */
export async function analyzeLocation(lat: number, lng: number): Promise<LocationAnalysis> {
  const response = await fetch(`${API_BASE}/location`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lng }),
  });
  if (!response.ok) {
    throw new Error(`Failed to analyze location: ${response.statusText}`);
  }
  const json = await response.json();
  return json.data ?? json;
}

/**
 * Geocode an address
 */
export async function geocodeAddress(address: string): Promise<GeocodeResponse> {
  const response = await fetch(`${API_BASE}/geocode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address }),
  });
  if (!response.ok) {
    throw new Error(`Failed to geocode address: ${response.statusText}`);
  }
  const json = await response.json();
  return json.data ?? json;
}

/**
 * Get K-Index description
 */
export function getKIndexDescription(kp: number): string {
  if (kp >= 9) return 'Extreme Geomagnetic Storm (G5)';
  if (kp >= 8) return 'Severe Geomagnetic Storm (G4)';
  if (kp >= 7) return 'Strong Geomagnetic Storm (G3)';
  if (kp >= 6) return 'Moderate Geomagnetic Storm (G2)';
  if (kp >= 5) return 'Minor Geomagnetic Storm (G1)';
  if (kp >= 4) return 'Unsettled Conditions';
  return 'Quiet Conditions';
}

/**
 * Get K-Index color
 */
export function getKIndexColor(kp: number): string {
  if (kp >= 8) return '#dc2626';
  if (kp >= 7) return '#ea580c';
  if (kp >= 6) return '#f59e0b';
  if (kp >= 5) return '#eab308';
  if (kp >= 4) return '#84cc16';
  return '#10b981';
}
