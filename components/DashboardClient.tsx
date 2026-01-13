'use client';

import React, { useMemo } from 'react';
import { SystemStateProvider, useSystemState, useTemporalState } from '@/context/SystemState';
import { TimeControl } from './TimeControl';
import { CommandConsole } from './CommandConsole';
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

/**
 * DashboardClient: Client-side dashboard with temporal awareness
 * Wraps all client components with SystemStateProvider
 */
export function DashboardClient({ kIndex, kIndexTimestamp }: DashboardClientProps) {
  return (
    <SystemStateProvider>
      <DashboardContent kIndex={kIndex} kIndexTimestamp={kIndexTimestamp} />
    </SystemStateProvider>
  );
}

/**
 * DashboardContent: Inner component with access to system state
 */
function DashboardContent({ kIndex, kIndexTimestamp }: DashboardClientProps) {
  const { state } = useSystemState();
  const { globalDate, temporalState } = useTemporalState();

  // Convert system nodes to FamilyMember format for the engine
  const familyMembers: FamilyMember[] = useMemo(() => {
    return state.nodes.map((node) => ({
      name: node.name,
      birthYear: node.birthYear,
      zodiacSign: node.zodiacSign,
    }));
  }, [state.nodes]);

  // Calculate family resonance with current temporal vector
  const familyResonance = useMemo(() => {
    if (familyMembers.length === 0) return null;

    return calculateFamilyResonance(
      familyMembers,
      { kIndex, timestamp: kIndexTimestamp },
      globalDate
    );
  }, [familyMembers, kIndex, kIndexTimestamp, globalDate]);

  return (
    <>
      {/* Temporal Controls - The "Seeker" Bar */}
      <TimeControl />

      {/* Family Resonance Field */}
      {familyResonance && (
        <ResonanceField
          resonance={familyResonance}
          environmentalVector={familyResonance.environmentalVector}
        />
      )}

      {/* Command Console - System Dynamics Layer */}
      <CommandConsole
        kIndex={kIndex}
        yearElement={temporalState.yearElement}
      />
    </>
  );
}

/**
 * ResonanceField: Displays family resonance calculations
 */
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
  // Get element color classes
  const getElementColor = (element: string): string => {
    const colors: Record<string, string> = {
      Fire: 'text-red-400',
      Earth: 'text-amber-400',
      Metal: 'text-gray-300',
      Water: 'text-blue-400',
      Wood: 'text-green-400',
    };
    return colors[element] || 'text-gray-400';
  };

  const getElementBorder = (element: string): string => {
    const colors: Record<string, string> = {
      Fire: 'border-red-800/50',
      Earth: 'border-amber-800/50',
      Metal: 'border-gray-600/50',
      Water: 'border-blue-800/50',
      Wood: 'border-green-800/50',
    };
    return colors[element] || 'border-gray-700';
  };

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-cyan-400 font-[family-name:var(--font-geist-mono)]">
          Family Resonance Field
        </h2>
        <div className={`px-3 py-1 rounded border ${getElementBorder(environmentalVector.element)}`}>
          <span className="text-xs text-gray-500">ENV VECTOR: </span>
          <span className={`font-semibold ${getElementColor(environmentalVector.element)}`}>
            {environmentalVector.element} {environmentalVector.archetype}
          </span>
          <span className="text-gray-500 text-xs ml-2">
            @ {environmentalVector.solarLongitude.toFixed(1)}°
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-950 p-4 rounded border border-green-900/30">
          <div className="text-gray-400 text-sm mb-1">Total Resonance</div>
          <div className="text-3xl font-bold text-green-400 font-[family-name:var(--font-geist-mono)]">
            {(resonance.totalResonance * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {getMetricLabel(resonance.totalResonance, 'resonance')}
          </div>
          <div className="mt-2 bg-gray-900 rounded-full h-2 overflow-hidden">
            <div
              className="bg-green-500 h-full transition-all duration-500"
              style={{ width: `${resonance.totalResonance * 100}%` }}
            />
          </div>
        </div>
        <div className="bg-gray-950 p-4 rounded border border-red-900/30">
          <div className="text-gray-400 text-sm mb-1">Total Damping</div>
          <div className="text-3xl font-bold text-red-400 font-[family-name:var(--font-geist-mono)]">
            {(resonance.totalDamping * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {getMetricLabel(resonance.totalDamping, 'damping')}
          </div>
          <div className="mt-2 bg-gray-900 rounded-full h-2 overflow-hidden">
            <div
              className="bg-red-500 h-full transition-all duration-500"
              style={{ width: `${resonance.totalDamping * 100}%` }}
            />
          </div>
        </div>
        <div className="bg-gray-950 p-4 rounded border border-blue-900/30">
          <div className="text-gray-400 text-sm mb-1">Coherence Field</div>
          <div className="text-3xl font-bold text-blue-400 font-[family-name:var(--font-geist-mono)]">
            {(resonance.coherenceField * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {getMetricLabel(resonance.coherenceField, 'coherence')}
          </div>
          <div className="mt-2 bg-gray-900 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-500"
              style={{ width: `${resonance.coherenceField * 100}%` }}
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
          {resonance.individualPatterns.map(({ member, pattern }, idx) => (
            <div
              key={idx}
              className={`bg-gray-950 border rounded p-4 hover:border-cyan-800 transition-colors ${getElementBorder(member.zodiacSign.element)}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-semibold text-gray-100">{member.name}</div>
                  <div className="text-xs text-gray-500">
                    {member.birthYear} •{' '}
                    <span className={getElementColor(member.zodiacSign.element)}>
                      {member.zodiacSign.name} ({member.zodiacSign.element})
                    </span>
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
  );
}
