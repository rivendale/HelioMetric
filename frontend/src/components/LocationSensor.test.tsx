import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocationSensor } from './LocationSensor';

// Mock the API client
vi.mock('@/api/client', () => ({
  analyzeLocation: vi.fn(),
  geocodeAddress: vi.fn(),
}));

import { analyzeLocation, geocodeAddress } from '@/api/client';

const mockGeocodeAddress = vi.mocked(geocodeAddress);
const mockAnalyzeLocation = vi.mocked(analyzeLocation);

describe('LocationSensor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders component with title and input', () => {
    render(<LocationSensor kIndex={3} />);

    expect(screen.getByText('Geomagnetic Location Sensor')).toBeInTheDocument();
    expect(screen.getByText('Storm impact varies by geographic position')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter city or address...')).toBeInTheDocument();
  });

  it('shows "Use my location" button', () => {
    render(<LocationSensor kIndex={3} />);

    expect(screen.getByText('Use my location')).toBeInTheDocument();
  });

  it('shows empty state message when no location is set', () => {
    render(<LocationSensor kIndex={3} />);

    expect(screen.getByText('Enter a location to see geomagnetic impact analysis')).toBeInTheDocument();
  });

  it('allows typing in the address input', async () => {
    const user = userEvent.setup();
    render(<LocationSensor kIndex={3} />);

    const input = screen.getByPlaceholderText('Enter city or address...');
    await user.type(input, 'New York');

    expect(input).toHaveValue('New York');
  });

  it('searches location when search button is clicked', async () => {
    const user = userEvent.setup();

    mockGeocodeAddress.mockResolvedValueOnce({
      location: {
        lat: 40.7128,
        lng: -74.006,
        formatted_address: 'New York, NY, USA',
        place_id: 'test123',
      },
      cached: false,
    });

    mockAnalyzeLocation.mockResolvedValueOnce({
      coordinates: { lat: 40.7128, lng: -74.006 },
      geomagnetic: { latitude: 51.2, declination: -13.5 },
      storm_impact: {
        factor: 1.1,
        description: 'Moderate impact expected',
        aurora_likelihood: 'possible',
      },
    });

    render(<LocationSensor kIndex={5} />);

    const input = screen.getByPlaceholderText('Enter city or address...');
    await user.type(input, 'New York');

    const searchButton = screen.getByRole('button', { name: '' }); // Search icon button
    await user.click(searchButton);

    await waitFor(() => {
      expect(mockGeocodeAddress).toHaveBeenCalledWith('New York');
    });

    await waitFor(() => {
      expect(screen.getByText('New York, NY, USA')).toBeInTheDocument();
    });
  });

  it('displays location analysis after successful search', async () => {
    const user = userEvent.setup();

    mockGeocodeAddress.mockResolvedValueOnce({
      location: {
        lat: 64.1466,
        lng: -21.9426,
        formatted_address: 'Reykjavik, Iceland',
        place_id: 'iceland123',
      },
      cached: false,
    });

    mockAnalyzeLocation.mockResolvedValueOnce({
      coordinates: { lat: 64.1466, lng: -21.9426 },
      geomagnetic: { latitude: 70.5, declination: -15.2 },
      storm_impact: {
        factor: 1.25,
        description: 'High latitude location experiences amplified storm effects',
        aurora_likelihood: 'very_likely',
      },
      timezone: {
        id: 'Atlantic/Reykjavik',
        name: 'GMT',
        utc_offset: 0,
      },
    });

    render(<LocationSensor kIndex={5} />);

    const input = screen.getByPlaceholderText('Enter city or address...');
    await user.type(input, 'Reykjavik');
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText('Reykjavik, Iceland')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('70.5°')).toBeInTheDocument(); // Geomagnetic latitude
      expect(screen.getByText('-15.2°')).toBeInTheDocument(); // Declination
      expect(screen.getByText('1.25x')).toBeInTheDocument(); // Storm impact factor
      expect(screen.getByText('very likely')).toBeInTheDocument(); // Aurora likelihood
    });
  });

  it('shows error when geocoding fails', async () => {
    const user = userEvent.setup();

    mockGeocodeAddress.mockResolvedValueOnce({
      location: null,
      cached: false,
    });

    render(<LocationSensor kIndex={3} />);

    const input = screen.getByPlaceholderText('Enter city or address...');
    await user.type(input, 'Invalid Location XYZ');
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText('Failed to geocode address')).toBeInTheDocument();
    });
  });

  it('clears location when Clear button is clicked', async () => {
    const user = userEvent.setup();

    mockGeocodeAddress.mockResolvedValueOnce({
      location: {
        lat: 40.7128,
        lng: -74.006,
        formatted_address: 'New York, NY, USA',
        place_id: 'test123',
      },
      cached: false,
    });

    mockAnalyzeLocation.mockResolvedValueOnce({
      coordinates: { lat: 40.7128, lng: -74.006 },
      geomagnetic: { latitude: 51.2, declination: -13.5 },
      storm_impact: {
        factor: 1.0,
        description: 'Standard impact',
        aurora_likelihood: 'rare',
      },
    });

    render(<LocationSensor kIndex={3} />);

    const input = screen.getByPlaceholderText('Enter city or address...');
    await user.type(input, 'New York');
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText('New York, NY, USA')).toBeInTheDocument();
    });

    const clearButton = screen.getByText('Clear');
    await user.click(clearButton);

    expect(screen.queryByText('New York, NY, USA')).not.toBeInTheDocument();
    expect(screen.getByText('Enter a location to see geomagnetic impact analysis')).toBeInTheDocument();
  });

  it('calls onLocationChange callback when location is set', async () => {
    const onLocationChange = vi.fn();
    const user = userEvent.setup();

    mockGeocodeAddress.mockResolvedValueOnce({
      location: {
        lat: 51.5074,
        lng: -0.1278,
        formatted_address: 'London, UK',
        place_id: 'london123',
      },
      cached: false,
    });

    mockAnalyzeLocation.mockResolvedValueOnce({
      coordinates: { lat: 51.5074, lng: -0.1278 },
      geomagnetic: { latitude: 54.3, declination: -1.2 },
      storm_impact: {
        factor: 1.05,
        description: 'Mild impact',
        aurora_likelihood: 'rare',
      },
    });

    render(<LocationSensor kIndex={3} onLocationChange={onLocationChange} />);

    const input = screen.getByPlaceholderText('Enter city or address...');
    await user.type(input, 'London');
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(onLocationChange).toHaveBeenCalledWith({
        lat: 51.5074,
        lng: -0.1278,
        formattedAddress: 'London, UK',
      });
    });
  });

  it('shows footer text about geomagnetic latitudes', () => {
    render(<LocationSensor kIndex={3} />);

    expect(screen.getByText('Higher geomagnetic latitudes experience stronger storm effects')).toBeInTheDocument();
  });
});
