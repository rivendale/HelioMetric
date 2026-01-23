import { useState, useEffect } from 'react';
import { SystemStateProvider } from '@/context/SystemState';
import { DashboardClient } from '@/components/DashboardClient';
import { fetchNOAAData, getKIndexDescription, getKIndexColor, type NOAASpaceWeatherData } from '@/api/client';

function App() {
  const [noaaData, setNoaaData] = useState<NOAASpaceWeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchNOAAData();
        setNoaaData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load NOAA data');
        // Set fallback data
        setNoaaData({
          latest: { time_tag: new Date().toISOString(), kp_index: 3, observed_time: new Date().toISOString() },
          readings: [],
          average_kp: 3,
          max_kp: 3,
          status: 'quiet',
          is_simulated: true,
        });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading NOAA Space Weather Data...</p>
        </div>
      </div>
    );
  }

  const kpIndex = noaaData?.latest.kp_index ?? 3;
  const kpTimestamp = noaaData?.latest.observed_time ? new Date(noaaData.latest.observed_time) : new Date();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 sm:p-8">
      {/* Header */}
      <header className="mb-8 border-b border-gray-800 pb-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold font-mono mb-2 text-cyan-400">
            HelioMetric Instrument Panel
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Evergreen Temporal Analysis Engine - NOAA Space Weather Integration
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Warning banner when using simulated data */}
        {(noaaData?.is_simulated || error) && (
          <div className="bg-amber-950/50 border border-amber-800 rounded-lg p-4 flex items-center gap-3">
            <div className="text-amber-400 text-xl">!</div>
            <div>
              <p className="text-amber-400 font-semibold text-sm">NOAA Data Unavailable</p>
              <p className="text-amber-500/80 text-xs">
                {error || 'Live space weather data is currently unavailable. Displaying simulated values for demonstration.'}
              </p>
            </div>
          </div>
        )}

        {/* NOAA K-Index Status Panel */}
        <section className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-cyan-400 font-mono">
            NOAA Planetary K-Index
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-950 p-4 rounded border border-gray-800">
              <div className="text-gray-400 text-sm mb-1">Current Kp</div>
              <div
                className="text-4xl font-bold font-mono"
                style={{ color: getKIndexColor(kpIndex) }}
              >
                {kpIndex.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {getKIndexDescription(kpIndex)}
              </div>
            </div>
            <div className="bg-gray-950 p-4 rounded border border-gray-800">
              <div className="text-gray-400 text-sm mb-1">8h Average</div>
              <div className="text-4xl font-bold text-blue-400 font-mono">
                {(noaaData?.average_kp ?? 3).toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Status: {(noaaData?.status ?? 'quiet').toUpperCase()}
              </div>
            </div>
            <div className="bg-gray-950 p-4 rounded border border-gray-800">
              <div className="text-gray-400 text-sm mb-1">8h Maximum</div>
              <div
                className="text-4xl font-bold font-mono"
                style={{ color: getKIndexColor(noaaData?.max_kp ?? 3) }}
              >
                {(noaaData?.max_kp ?? 3).toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {kpTimestamp.toLocaleString()}
              </div>
            </div>
          </div>
        </section>

        {/* Client-Side Dashboard with Temporal Controls */}
        <SystemStateProvider>
          <DashboardClient
            kIndex={kpIndex}
            kIndexTimestamp={kpTimestamp}
          />
        </SystemStateProvider>

        {/* Footer */}
        <footer className="text-center text-xs text-gray-500 pt-8 pb-4">
          <p>
            HelioMetric v0.3.0 - Evergreen Engine - AGPL-3.0 License -
            Data: NOAA Space Weather Prediction Center
          </p>
          <p className="mt-1">
            Heliospheric correlation framework using Wu Xing elemental theory -
            Li Chun-Accurate Temporal Calculations
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
