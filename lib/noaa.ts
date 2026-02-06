/**
 * NOAA Space Weather K-Index API Integration
 * Fetches real-time geomagnetic activity data using standard fetch (Node.js runtime)
 * Now with Redis caching for improved performance
 *
 * K-Index Scale (0-9):
 * 0-4: Quiet to unsettled
 * 5: Minor storm
 * 6: Moderate storm
 * 7: Strong storm
 * 8: Severe storm
 * 9: Extreme storm
 */

import { getOrCompute, CacheKeys, CacheTTL } from './redis';

export interface KIndexReading {
  timeTag: string; // ISO 8601 timestamp
  kpIndex: number; // Planetary K-Index (0-9)
  observedTime: Date;
}

export interface NOAASpaceWeatherData {
  latest: KIndexReading;
  readings: KIndexReading[];
  averageKp: number;
  maxKp: number;
  status: 'quiet' | 'unsettled' | 'storm';
  isSimulated?: boolean; // True when NOAA API is unavailable and mock data is used
}

/**
 * Fetch current K-Index from NOAA SWPC JSON API
 * Uses the 3-day K-Index forecast/observation endpoint
 * Results are cached in Redis for 5 minutes
 */
export async function fetchKIndex(): Promise<NOAASpaceWeatherData> {
  return getOrCompute(
    CacheKeys.NOAA_KINDEX,
    fetchKIndexFromAPI,
    CacheTTL.NOAA_DATA
  );
}

/**
 * Direct API fetch (used by caching layer)
 */
async function fetchKIndexFromAPI(): Promise<NOAASpaceWeatherData> {
  try {
    // NOAA SWPC JSON API endpoint for K-Index data
    const response = await fetch(
      'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json',
      {
        cache: 'no-store', // Ensure fresh data for real-time monitoring
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`NOAA API error: ${response.status} ${response.statusText}`);
    }

    const data: unknown = await response.json();
    
    // Data format: [[header], [timestamp, kp, kp_index], ...]
    // Skip the header row
    if (!Array.isArray(data)) {
      throw new Error('Invalid response format from NOAA API');
    }
    
    const readings: KIndexReading[] = data
      .slice(1) // Skip header
      .filter((row: unknown): row is [string, number, string?] => {
        return Array.isArray(row) && row.length >= 2
          && typeof row[0] === 'string'
          && row[1] !== null && row[1] !== undefined;
      })
      .map((row: [string, number, string?]) => ({
        timeTag: row[0],
        kpIndex: parseFloat(String(row[1])),
        observedTime: new Date(row[0]),
      }))
      .sort((a: KIndexReading, b: KIndexReading) => 
        b.observedTime.getTime() - a.observedTime.getTime()
      );

    if (readings.length === 0) {
      throw new Error('No valid K-Index readings available from NOAA');
    }

    const latest = readings[0];
    
    // Calculate statistics
    const validKpValues = readings.map(r => r.kpIndex).filter(v => !isNaN(v));
    const averageKp = validKpValues.reduce((sum, val) => sum + val, 0) / validKpValues.length;
    const maxKp = Math.max(...validKpValues);
    
    // Determine geomagnetic storm status
    const status = getStormStatus(latest.kpIndex);

    return {
      latest,
      readings: readings.slice(0, 24), // Last 24 readings (8 hours)
      averageKp: Math.round(averageKp * 100) / 100,
      maxKp,
      status,
    };
  } catch (error) {
    console.error('Error fetching K-Index from NOAA:', error);
    
    // Return mock data for development/offline mode
    return getMockKIndexData();
  }
}

/**
 * Determine storm status from K-Index value
 */
function getStormStatus(kp: number): 'quiet' | 'unsettled' | 'storm' {
  if (kp >= 5) return 'storm';
  if (kp >= 4) return 'unsettled';
  return 'quiet';
}

/**
 * Mock data for development and error fallback
 */
function getMockKIndexData(): NOAASpaceWeatherData {
  const now = new Date();
  const mockReadings: KIndexReading[] = [];
  
  // Generate 24 mock readings (past 8 hours, 3-hour intervals)
  for (let i = 0; i < 24; i++) {
    const timeOffset = (23 - i) * 15 * 60 * 1000; // 15 minutes apart
    const timestamp = new Date(now.getTime() - timeOffset);
    
    // Simulate varying K-Index with some randomness
    const baseKp = 3 + Math.sin(i / 4) * 2;
    const kpIndex = Math.max(0, Math.min(9, baseKp + (Math.random() - 0.5)));
    
    mockReadings.push({
      timeTag: timestamp.toISOString(),
      kpIndex: Math.round(kpIndex * 10) / 10,
      observedTime: timestamp,
    });
  }
  
  const latest = mockReadings[mockReadings.length - 1];
  const avgKp = mockReadings.reduce((sum, r) => sum + r.kpIndex, 0) / mockReadings.length;
  const maxKp = Math.max(...mockReadings.map(r => r.kpIndex));
  
  return {
    latest,
    readings: mockReadings,
    averageKp: Math.round(avgKp * 100) / 100,
    maxKp,
    status: getStormStatus(latest.kpIndex),
    isSimulated: true,
  };
}

/**
 * Get human-readable K-Index description
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
 * Get color code for K-Index visualization
 */
export function getKIndexColor(kp: number): string {
  if (kp >= 8) return '#dc2626'; // red-600
  if (kp >= 7) return '#ea580c'; // orange-600
  if (kp >= 6) return '#f59e0b'; // amber-500
  if (kp >= 5) return '#eab308'; // yellow-500
  if (kp >= 4) return '#84cc16'; // lime-500
  return '#10b981'; // emerald-500
}
