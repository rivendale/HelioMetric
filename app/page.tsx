import {
  fetchKIndex,
  getKIndexDescription,
  getKIndexColor
} from '@/lib/noaa';
import {
  calculateFamilyResonance,
  getZodiacSign,
  getMetricLabel,
  type FamilyMember
} from '@/lib/HelioEngine';
import { CommandConsole } from '@/components/CommandConsole';

// Sample family data for demonstration
const DEMO_FAMILY: FamilyMember[] = [
  { name: 'Parent Alpha', birthYear: 1978, zodiacSign: getZodiacSign(1978) },
  { name: 'Parent Beta', birthYear: 1980, zodiacSign: getZodiacSign(1980) },
  { name: 'Child Gamma', birthYear: 2008, zodiacSign: getZodiacSign(2008) },
  { name: 'Child Delta', birthYear: 2012, zodiacSign: getZodiacSign(2012) },
];

export default async function Home() {
  // Fetch live NOAA K-Index data (server-side)
  const noaaData = await fetchKIndex();
  
  // Calculate family resonance with current heliospheric state
  const familyResonance = calculateFamilyResonance(DEMO_FAMILY, {
    kIndex: noaaData.latest.kpIndex,
    timestamp: noaaData.latest.observedTime,
  });

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 sm:p-8">
      {/* Header */}
      <header className="mb-8 border-b border-gray-800 pb-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold font-[family-name:var(--font-geist-mono)] mb-2 text-cyan-400">
            HelioMetric Instrument Panel
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            2026 Fire Horse Interference Analysis • NOAA Space Weather Integration
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* NOAA K-Index Status Panel */}
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

        {/* Family Resonance Field */}
        <section className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-cyan-400 font-[family-name:var(--font-geist-mono)]">
            Family Resonance Field
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-950 p-4 rounded border border-green-900/30">
              <div className="text-gray-400 text-sm mb-1">Total Resonance</div>
              <div className="text-3xl font-bold text-green-400 font-[family-name:var(--font-geist-mono)]">
                {(familyResonance.totalResonance * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {getMetricLabel(familyResonance.totalResonance, 'resonance')}
              </div>
              <div className="mt-2 bg-gray-900 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-green-500 h-full transition-all duration-500"
                  style={{ width: `${familyResonance.totalResonance * 100}%` }}
                />
              </div>
            </div>
            <div className="bg-gray-950 p-4 rounded border border-red-900/30">
              <div className="text-gray-400 text-sm mb-1">Total Damping</div>
              <div className="text-3xl font-bold text-red-400 font-[family-name:var(--font-geist-mono)]">
                {(familyResonance.totalDamping * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {getMetricLabel(familyResonance.totalDamping, 'damping')}
              </div>
              <div className="mt-2 bg-gray-900 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-red-500 h-full transition-all duration-500"
                  style={{ width: `${familyResonance.totalDamping * 100}%` }}
                />
              </div>
            </div>
            <div className="bg-gray-950 p-4 rounded border border-blue-900/30">
              <div className="text-gray-400 text-sm mb-1">Coherence Field</div>
              <div className="text-3xl font-bold text-blue-400 font-[family-name:var(--font-geist-mono)]">
                {(familyResonance.coherenceField * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {getMetricLabel(familyResonance.coherenceField, 'coherence')}
              </div>
              <div className="mt-2 bg-gray-900 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-blue-500 h-full transition-all duration-500"
                  style={{ width: `${familyResonance.coherenceField * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Individual Family Member Grid */}
          <div className="border-t border-gray-800 pt-4 mt-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
              Individual Interference Patterns
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {familyResonance.individualPatterns.map(({ member, pattern }, idx) => (
                <div 
                  key={idx}
                  className="bg-gray-950 border border-gray-800 rounded p-4 hover:border-cyan-800 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-semibold text-gray-100">{member.name}</div>
                      <div className="text-xs text-gray-500">
                        {member.birthYear} • {member.zodiacSign.name} ({member.zodiacSign.element})
                      </div>
                    </div>
                    <div className="text-xs bg-cyan-950 text-cyan-400 px-2 py-1 rounded font-[family-name:var(--font-geist-mono)]">
                      H{pattern.harmonicOrder}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Resonance</span>
                      <span className="font-[family-name:var(--font-geist-mono)] text-green-400">
                        {(pattern.resonanceIndex * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="bg-gray-900 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-400 h-full"
                        style={{ width: `${pattern.resonanceIndex * 100}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Damping</span>
                      <span className="font-[family-name:var(--font-geist-mono)] text-red-400">
                        {(pattern.dampingCoefficient * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="bg-gray-900 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-red-500 to-orange-400 h-full"
                        style={{ width: `${pattern.dampingCoefficient * 100}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Phase Coherence</span>
                      <span className="font-[family-name:var(--font-geist-mono)] text-blue-400">
                        {(pattern.phaseCoherence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="bg-gray-900 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full"
                        style={{ width: `${pattern.phaseCoherence * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Command Console - System Dynamics Layer */}
        <CommandConsole
          kIndex={noaaData.latest.kpIndex}
          yearElement="Fire" // 2026 Fire Horse Year
        />

        {/* Footer */}
        <footer className="text-center text-xs text-gray-500 pt-8 pb-4">
          <p>
            HelioMetric v0.2.0 • AGPL-3.0 License •
            Data: NOAA Space Weather Prediction Center
          </p>
          <p className="mt-1">
            Heliospheric correlation framework using Wu Xing elemental theory •
            System Dynamics Engine Active
          </p>
        </footer>
      </div>
    </div>
  );
}
