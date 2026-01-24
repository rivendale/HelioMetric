import { useMemo } from 'react';
import { useSystemState, useTemporalState } from '@/context/SystemState';
import { useUIMode } from '@/context/UIMode';
import { TimeControl } from './TimeControl';
import { CommandConsole } from './CommandConsole';
import { TacticalDeck } from './TacticalDeck';
import { MarketSensor } from './MarketSensor';
import { LocationSensor } from './LocationSensor';
import { PersonalInsights } from './PersonalInsights';
import {
  calculateFamilyResonance,
  getMetricLabel,
  type FamilyMember,
  type EnvironmentalVector
} from '@/lib/HelioEngine';

interface DashboardClientProps {
  kIndex: number;
  kIndexTimestamp: Date;
}

export function DashboardClient({ kIndex, kIndexTimestamp }: DashboardClientProps) {
  return <DashboardContent kIndex={kIndex} kIndexTimestamp={kIndexTimestamp} />;
}

function DashboardContent({ kIndex, kIndexTimestamp }: DashboardClientProps) {
  const { state } = useSystemState();
  const { globalDate, temporalState } = useTemporalState();
  const { state: uiState } = useUIMode();

  const familyMembers: FamilyMember[] = useMemo(() => {
    return state.nodes.map((node) => ({
      name: node.name,
      birthYear: node.birthYear,
      zodiacSign: node.zodiacSign,
    }));
  }, [state.nodes]);

  const familyResonance = useMemo(() => {
    if (familyMembers.length === 0) return null;

    return calculateFamilyResonance(
      familyMembers,
      { kIndex, timestamp: kIndexTimestamp },
      globalDate
    );
  }, [familyMembers, kIndex, kIndexTimestamp, globalDate]);

  // Render based on mode
  const renderBasicMode = () => (
    <>
      <TimeControl />

      {familyResonance && (
        <ResonanceField
          resonance={familyResonance}
          environmentalVector={familyResonance.environmentalVector}
        />
      )}

      <CommandConsole
        kIndex={kIndex}
        yearElement={temporalState.yearElement}
      />

      <TacticalDeck kIndex={kIndex} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MarketSensor
          yearElement={temporalState.yearElement}
          kIndex={kIndex}
        />
        <LocationSensor kIndex={kIndex} />
      </div>
    </>
  );

  const renderInvestmentMode = () => (
    <>
      <TimeControl />

      {/* Investment-focused summary */}
      <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Solar Activity & Market Correlation
        </h2>
        <p className="text-sm text-slate-600 mb-4">
          Geomagnetic activity can influence market behavior. Higher K-Index values
          are associated with increased market volatility and risk-off sentiment.
        </p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-slate-50 p-3 rounded-lg">
            <span className="text-slate-500">Current Impact:</span>
            <span className={`ml-2 font-medium ${kIndex < 4 ? 'text-green-600' : kIndex < 6 ? 'text-amber-600' : 'text-red-600'}`}>
              {kIndex < 4 ? 'Low' : kIndex < 6 ? 'Moderate' : 'High'}
            </span>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg">
            <span className="text-slate-500">Market Sentiment:</span>
            <span className={`ml-2 font-medium ${kIndex < 4 ? 'text-green-600' : kIndex < 6 ? 'text-amber-600' : 'text-red-600'}`}>
              {kIndex < 4 ? 'Risk-On' : kIndex < 6 ? 'Neutral' : 'Risk-Off'}
            </span>
          </div>
        </div>
      </section>

      <MarketSensor
        yearElement={temporalState.yearElement}
        kIndex={kIndex}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LocationSensor kIndex={kIndex} />
        <TacticalDeck kIndex={kIndex} />
      </div>
    </>
  );

  const renderCustomMode = () => (
    <>
      <PersonalInsights kIndex={kIndex} yearElement={temporalState.yearElement} />

      <TimeControl />

      {familyResonance && (
        <ResonanceField
          resonance={familyResonance}
          environmentalVector={familyResonance.environmentalVector}
        />
      )}

      <CommandConsole
        kIndex={kIndex}
        yearElement={temporalState.yearElement}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MarketSensor
          yearElement={temporalState.yearElement}
          kIndex={kIndex}
        />
        <LocationSensor kIndex={kIndex} />
      </div>
    </>
  );

  switch (uiState.mode) {
    case 'investment':
      return renderInvestmentMode();
    case 'custom':
      return renderCustomMode();
    case 'basic':
    default:
      return renderBasicMode();
  }
}

interface ResonanceFieldProps {
  resonance: {
    totalResonance: number;
    totalDamping: number;
    coherenceField: number;
    individualPatterns: Array<{
      member: FamilyMember;
      pattern: {
        resonanceIndex: number;
        dampingCoefficient: number;
        phaseCoherence: number;
        harmonicOrder: number;
      };
    }>;
    environmentalVector: EnvironmentalVector;
  };
  environmentalVector: EnvironmentalVector;
}

function ResonanceField({ resonance, environmentalVector }: ResonanceFieldProps) {
  const getElementColor = (element: string): string => {
    const colors: Record<string, string> = {
      Fire: 'text-red-500',
      Earth: 'text-amber-600',
      Metal: 'text-slate-500',
      Water: 'text-blue-500',
      Wood: 'text-green-500',
    };
    return colors[element] || 'text-slate-500';
  };

  const getElementBorder = (element: string): string => {
    const colors: Record<string, string> = {
      Fire: 'border-red-200',
      Earth: 'border-amber-200',
      Metal: 'border-slate-300',
      Water: 'border-blue-200',
      Wood: 'border-green-200',
    };
    return colors[element] || 'border-slate-200';
  };

  return (
    <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800">
          Family Resonance Analysis
        </h2>
        <div className={`px-3 py-1 rounded-lg border ${getElementBorder(environmentalVector.element)} bg-slate-50`}>
          <span className="text-xs text-slate-500">Current: </span>
          <span className={`font-medium ${getElementColor(environmentalVector.element)}`}>
            {environmentalVector.element} {environmentalVector.archetype}
          </span>
          <span className="text-slate-400 text-xs ml-2">
            @ {environmentalVector.solarLongitude.toFixed(1)}°
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <div className="text-slate-600 text-sm mb-1">Total Resonance</div>
          <div className="text-3xl font-bold text-green-600">
            {(resonance.totalResonance * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {getMetricLabel(resonance.totalResonance, 'resonance')}
          </div>
          <div className="mt-2 bg-green-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-green-500 h-full transition-all duration-500"
              style={{ width: `${resonance.totalResonance * 100}%` }}
            />
          </div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
          <div className="text-slate-600 text-sm mb-1">Total Damping</div>
          <div className="text-3xl font-bold text-red-500">
            {(resonance.totalDamping * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {getMetricLabel(resonance.totalDamping, 'damping')}
          </div>
          <div className="mt-2 bg-red-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-red-500 h-full transition-all duration-500"
              style={{ width: `${resonance.totalDamping * 100}%` }}
            />
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div className="text-slate-600 text-sm mb-1">Coherence Field</div>
          <div className="text-3xl font-bold text-blue-600">
            {(resonance.coherenceField * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {getMetricLabel(resonance.coherenceField, 'coherence')}
          </div>
          <div className="mt-2 bg-blue-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-500"
              style={{ width: `${resonance.coherenceField * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-4 mt-4">
        <h3 className="text-sm font-medium text-slate-600 mb-3">
          Individual Patterns
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resonance.individualPatterns.map(({ member, pattern }, idx) => (
            <div
              key={idx}
              className={`bg-slate-50 border rounded-lg p-4 hover:shadow-sm transition-shadow ${getElementBorder(member.zodiacSign.element)}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-medium text-slate-800">{member.name}</div>
                  <div className="text-xs text-slate-500">
                    {member.birthYear} -{' '}
                    <span className={getElementColor(member.zodiacSign.element)}>
                      {member.zodiacSign.name} ({member.zodiacSign.element})
                    </span>
                  </div>
                </div>
                <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  H{pattern.harmonicOrder}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Resonance</span>
                  <span className="font-medium text-green-600">
                    {(pattern.resonanceIndex * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-green-500 h-full"
                    style={{ width: `${pattern.resonanceIndex * 100}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Damping</span>
                  <span className="font-medium text-red-500">
                    {(pattern.dampingCoefficient * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-red-500 h-full"
                    style={{ width: `${pattern.dampingCoefficient * 100}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Phase Coherence</span>
                  <span className="font-medium text-blue-600">
                    {(pattern.phaseCoherence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full"
                    style={{ width: `${pattern.phaseCoherence * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
