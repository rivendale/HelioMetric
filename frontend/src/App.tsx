import { useState, useEffect } from 'react';
import { SystemStateProvider } from '@/context/SystemState';
import { UIModeProvider, useUIMode, getModeInfo } from '@/context/UIMode';
import { DashboardClient } from '@/components/DashboardClient';
import { ModeSelector } from '@/components/ModeSelector';
import { fetchNOAAData, getKIndexDescription, getKIndexColor, type NOAASpaceWeatherData } from '@/api/client';

function AppContent() {
  const { state: uiState, resetOnboarding } = useUIMode();
  const [noaaData, setNoaaData] = useState<NOAASpaceWeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModeSettings, setShowModeSettings] = useState(false);

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

  // Show onboarding if user hasn't completed it
  if (!uiState.hasCompletedOnboarding) {
    return <ModeSelector isOnboarding onComplete={() => {}} />;
  }

  // Show mode settings modal
  if (showModeSettings) {
    return (
      <ModeSelector
        onComplete={() => setShowModeSettings(false)}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading space weather data...</p>
        </div>
      </div>
    );
  }

  const kpIndex = noaaData?.latest.kp_index ?? 3;
  const kpTimestamp = noaaData?.latest.observed_time ? new Date(noaaData.latest.observed_time) : new Date();
  const modeInfo = getModeInfo(uiState.mode);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-800">
                HelioMetric
              </h1>
              <p className="text-slate-500 text-sm">
                Space Weather & Solar Activity Dashboard
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Current Mode Badge */}
              <button
                onClick={() => setShowModeSettings(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <span className="text-lg">{modeInfo.icon}</span>
                <span className="text-sm font-medium text-slate-700">{modeInfo.name} Mode</span>
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Warning banner when using simulated data */}
        {(noaaData?.is_simulated || error) && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
            <div className="text-amber-500 text-xl">!</div>
            <div>
              <p className="text-amber-700 font-medium text-sm">Data Unavailable</p>
              <p className="text-amber-600 text-xs">
                {error || 'Live space weather data is currently unavailable. Displaying sample values.'}
              </p>
            </div>
          </div>
        )}

        {/* K-Index Summary Card */}
        <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Planetary K-Index
            </h2>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
              NOAA Space Weather
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <div className="text-slate-500 text-sm mb-1">Current</div>
              <div
                className="text-4xl font-bold"
                style={{ color: getKIndexColor(kpIndex) }}
              >
                {kpIndex.toFixed(1)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {getKIndexDescription(kpIndex)}
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <div className="text-slate-500 text-sm mb-1">8h Average</div>
              <div className="text-4xl font-bold text-blue-600">
                {(noaaData?.average_kp ?? 3).toFixed(1)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Status: {(noaaData?.status ?? 'quiet').charAt(0).toUpperCase() + (noaaData?.status ?? 'quiet').slice(1)}
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <div className="text-slate-500 text-sm mb-1">8h Maximum</div>
              <div
                className="text-4xl font-bold"
                style={{ color: getKIndexColor(noaaData?.max_kp ?? 3) }}
              >
                {(noaaData?.max_kp ?? 3).toFixed(1)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {kpTimestamp.toLocaleString()}
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard Content - Mode Aware */}
        <SystemStateProvider>
          <DashboardClient
            kIndex={kpIndex}
            kIndexTimestamp={kpTimestamp}
          />
        </SystemStateProvider>

        {/* Footer */}
        <footer className="text-center text-xs text-slate-400 pt-8 pb-4">
          <p>
            HelioMetric v0.4.0 - Data from NOAA Space Weather Prediction Center
          </p>
          <p className="mt-1">
            <button
              onClick={() => {
                if (confirm('Reset all settings and start over?')) {
                  resetOnboarding();
                }
              }}
              className="text-slate-400 hover:text-slate-600 underline"
            >
              Reset Settings
            </button>
          </p>
        </footer>
      </div>
    </div>
  );
}

function App() {
  return (
    <UIModeProvider>
      <AppContent />
    </UIModeProvider>
  );
}

export default App;
