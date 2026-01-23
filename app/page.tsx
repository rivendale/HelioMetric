import {
  fetchKIndex,
  getKIndexDescription,
  getKIndexColor
} from '@/lib/noaa';
import { DashboardClient } from '@/components/DashboardClient';

// Force dynamic rendering - real-time NOAA data requires fresh fetches
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * HelioMetric Instrument Panel
 * Server Component - fetches NOAA data and passes to client
 */
export default async function Home() {
  // Fetch live NOAA K-Index data (server-side)
  const noaaData = await fetchKIndex();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 sm:p-8">
      {/* Header */}
      <header className="mb-8 border-b border-gray-800 pb-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold font-[family-name:var(--font-geist-mono)] mb-2 text-cyan-400">
            HelioMetric Instrument Panel
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Evergreen Temporal Analysis Engine • NOAA Space Weather Integration
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Warning banner when using simulated data */}
        {noaaData.isSimulated && (
          <div className="bg-amber-950/50 border border-amber-800 rounded-lg p-4 flex items-center gap-3">
            <div className="text-amber-400 text-xl">⚠</div>
            <div>
              <p className="text-amber-400 font-semibold text-sm">NOAA Data Unavailable</p>
              <p className="text-amber-500/80 text-xs">
                Live space weather data is currently unavailable. Displaying simulated values for demonstration.
              </p>
            </div>
          </div>
        )}

        {/* NOAA K-Index Status Panel (Static Server Data) */}
        <section className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-cyan-400 font-[family-name:var(--font-geist-mono)]">
            NOAA Planetary K-Index
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-950 p-4 rounded border border-gray-800">
              <div className="text-gray-400 text-sm mb-1">Current Kp</div>
              <div
                className="text-4xl font-bold font-[family-name:var(--font-geist-mono)]"
                style={{ color: getKIndexColor(noaaData.latest.kpIndex) }}
              >
                {noaaData.latest.kpIndex.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {getKIndexDescription(noaaData.latest.kpIndex)}
              </div>
            </div>
            <div className="bg-gray-950 p-4 rounded border border-gray-800">
              <div className="text-gray-400 text-sm mb-1">8h Average</div>
              <div className="text-4xl font-bold text-blue-400 font-[family-name:var(--font-geist-mono)]">
                {noaaData.averageKp.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Status: {noaaData.status.toUpperCase()}
              </div>
            </div>
            <div className="bg-gray-950 p-4 rounded border border-gray-800">
              <div className="text-gray-400 text-sm mb-1">8h Maximum</div>
              <div
                className="text-4xl font-bold font-[family-name:var(--font-geist-mono)]"
                style={{ color: getKIndexColor(noaaData.maxKp) }}
              >
                {noaaData.maxKp.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(noaaData.latest.timeTag).toLocaleString()}
              </div>
            </div>
          </div>
        </section>

        {/* Client-Side Dashboard with Temporal Controls */}
        <DashboardClient
          kIndex={noaaData.latest.kpIndex}
          kIndexTimestamp={noaaData.latest.observedTime}
        />

        {/* Footer */}
        <footer className="text-center text-xs text-gray-500 pt-8 pb-4">
          <p>
            HelioMetric v0.3.0 • Evergreen Engine • AGPL-3.0 License •
            Data: NOAA Space Weather Prediction Center
          </p>
          <p className="mt-1">
            Heliospheric correlation framework using Wu Xing elemental theory •
            Li Chun-Accurate Temporal Calculations
          </p>
        </footer>
      </div>
    </div>
  );
}
