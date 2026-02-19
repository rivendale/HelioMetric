'use client';

import React, { useMemo, useState } from 'react';
import { SystemStateProvider, useSystemState, useTemporalState, useFamilyMembers } from '@/context/SystemState';
import { TimeControl } from './TimeControl';
import { CommandConsole } from './CommandConsole';
import { PersonManager } from './PersonManager';
import { ZodiacExplorer } from './ZodiacExplorer';
import { RelationshipMap } from './RelationshipMap';
import { ZodiacProfileCard } from './ZodiacProfileCard';
import { LocationSensor } from './LocationSensor';
import {
  calculateFamilyResonance,
  getMetricLabel,
  type FamilyMember,
  type EnvironmentalVector
} from '@/lib/HelioEngine';
import {
  Users,
  Search,
  GitCompareArrows,
  Activity,
  MapPin,
  User,
} from 'lucide-react';

interface DashboardClientProps {
  kIndex: number;
  kIndexTimestamp: string;
}

type DashboardTab = 'people' | 'profiles' | 'compatibility' | 'explorer' | 'analysis' | 'location';

const TAB_CONFIG: { id: DashboardTab; label: string; icon: React.ReactNode; shortLabel: string }[] = [
  { id: 'people', label: 'People', shortLabel: 'People', icon: <Users className="w-4 h-4" /> },
  { id: 'profiles', label: 'Zodiac Profiles', shortLabel: 'Profiles', icon: <User className="w-4 h-4" /> },
  { id: 'compatibility', label: 'Compatibility', shortLabel: 'Compat', icon: <GitCompareArrows className="w-4 h-4" /> },
  { id: 'explorer', label: 'Zodiac Explorer', shortLabel: 'Explorer', icon: <Search className="w-4 h-4" /> },
  { id: 'analysis', label: 'Analysis', shortLabel: 'Analysis', icon: <Activity className="w-4 h-4" /> },
  { id: 'location', label: 'Location', shortLabel: 'Location', icon: <MapPin className="w-4 h-4" /> },
];

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
  const { all: allNodes } = useFamilyMembers();
  const [activeTab, setActiveTab] = useState<DashboardTab>('people');

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
      { kIndex, timestamp: new Date(kIndexTimestamp) },
      globalDate
    );
  }, [familyMembers, kIndex, kIndexTimestamp, globalDate]);

  return (
    <>
      {/* Temporal Controls - The "Seeker" Bar */}
      <TimeControl />

      {/* Tab Navigation */}
      <nav className="bg-gray-900 border border-gray-800 rounded-lg p-1.5 flex gap-1 overflow-x-auto">
        {TAB_CONFIG.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium whitespace-nowrap transition-all
              ${activeTab === tab.id
                ? 'bg-cyan-900/40 text-cyan-300 border border-cyan-800/50'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 border border-transparent'
              }
            `}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.shortLabel}</span>
            {tab.id === 'people' && (
              <span className="ml-1 text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded-full">
                {allNodes.length}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'people' && <PersonManager />}

        {activeTab === 'profiles' && (
          <div className="space-y-4">
            {allNodes.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center py-12">
                <User className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500">Add people in the People tab to see their zodiac profiles.</p>
              </div>
            ) : (
              allNodes.map((node) => (
                <ZodiacProfileCard key={node.id} node={node} />
              ))
            )}
          </div>
        )}

        {activeTab === 'compatibility' && <RelationshipMap />}

        {activeTab === 'explorer' && <ZodiacExplorer />}

        {activeTab === 'analysis' && (
          <>
            {/* Family Resonance Field */}
            {familyResonance && (
              <ResonanceField
                resonance={familyResonance}
                environmentalVector={familyResonance.environmentalVector}
              />
            )}

            {/* Command Console - System Dynamics Layer */}
            <div className="mt-6">
              <CommandConsole
                kIndex={kIndex}
                yearElement={temporalState.yearElement}
              />
            </div>
          </>
        )}

        {activeTab === 'location' && (
          <LocationSensor kIndex={kIndex} />
        )}
      </div>
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
