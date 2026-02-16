import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchNOAAData,
  analyzeLocation,
  geocodeAddress,
  getKIndexDescription,
  getKIndexColor,
} from './client';

describe('API Client', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    mockFetch.mockReset();
  });

  describe('fetchNOAAData', () => {
    it('should fetch and return NOAA data from envelope', async () => {
      const mockData = {
        latest: { time_tag: '2024-01-01', kp_index: 3, observed_time: '2024-01-01T00:00:00Z' },
        readings: [],
        average_kp: 3,
        max_kp: 4,
        status: 'quiet',
        is_simulated: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockData }),
      });

      const result = await fetchNOAAData();

      expect(mockFetch).toHaveBeenCalledWith('/api/noaa');
      expect(result).toEqual(mockData);
    });

    it('should handle unwrapped response for backward compatibility', async () => {
      const mockData = {
        latest: { time_tag: '2024-01-01', kp_index: 3, observed_time: '2024-01-01T00:00:00Z' },
        readings: [],
        average_kp: 3,
        max_kp: 4,
        status: 'quiet',
        is_simulated: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await fetchNOAAData();

      expect(result).toEqual(mockData);
    });

    it('should throw error on failed fetch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      await expect(fetchNOAAData()).rejects.toThrow('Failed to fetch NOAA data');
    });
  });

  describe('analyzeLocation', () => {
    it('should POST location and return analysis from envelope', async () => {
      const mockAnalysis = {
        coordinates: { lat: 40.7128, lng: -74.006 },
        geomagnetic: { latitude: 51.2, declination: -13.5 },
        storm_impact: { factor: 1.1, description: 'Moderate impact', aurora_likelihood: 'possible' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockAnalysis }),
      });

      const result = await analyzeLocation(40.7128, -74.006);

      expect(mockFetch).toHaveBeenCalledWith('/api/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: 40.7128, lng: -74.006 }),
      });
      expect(result).toEqual(mockAnalysis);
    });

    it('should throw error on failed analysis', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
      });

      await expect(analyzeLocation(0, 0)).rejects.toThrow('Failed to analyze location');
    });
  });

  describe('geocodeAddress', () => {
    it('should POST address and return geocode result from envelope', async () => {
      const mockGeocode = {
        location: {
          lat: 40.7128,
          lng: -74.006,
          formatted_address: 'New York, NY, USA',
          place_id: 'abc123',
        },
        cached: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockGeocode }),
      });

      const result = await geocodeAddress('New York');

      expect(mockFetch).toHaveBeenCalledWith('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: 'New York' }),
      });
      expect(result).toEqual(mockGeocode);
    });
  });
});

describe('K-Index Utility Functions', () => {
  describe('getKIndexDescription', () => {
    it('should return correct descriptions for all K-Index levels', () => {
      expect(getKIndexDescription(9)).toBe('Extreme Geomagnetic Storm (G5)');
      expect(getKIndexDescription(8)).toBe('Severe Geomagnetic Storm (G4)');
      expect(getKIndexDescription(7)).toBe('Strong Geomagnetic Storm (G3)');
      expect(getKIndexDescription(6)).toBe('Moderate Geomagnetic Storm (G2)');
      expect(getKIndexDescription(5)).toBe('Minor Geomagnetic Storm (G1)');
      expect(getKIndexDescription(4)).toBe('Unsettled Conditions');
      expect(getKIndexDescription(3)).toBe('Quiet Conditions');
      expect(getKIndexDescription(0)).toBe('Quiet Conditions');
    });
  });

  describe('getKIndexColor', () => {
    it('should return correct colors for all K-Index levels', () => {
      expect(getKIndexColor(9)).toBe('#dc2626'); // red
      expect(getKIndexColor(8)).toBe('#dc2626'); // red
      expect(getKIndexColor(7)).toBe('#ea580c'); // orange
      expect(getKIndexColor(6)).toBe('#f59e0b'); // amber
      expect(getKIndexColor(5)).toBe('#eab308'); // yellow
      expect(getKIndexColor(4)).toBe('#84cc16'); // lime
      expect(getKIndexColor(3)).toBe('#10b981'); // emerald
      expect(getKIndexColor(0)).toBe('#10b981'); // emerald
    });
  });
});
