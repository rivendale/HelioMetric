'use client';

import React from 'react';
import { TacticalDeck } from './TacticalDeck';
import { MarketSensor } from './MarketSensor';
import { useSystemState, useFamilyMembers, SystemStateProvider } from '@/context/SystemState';
import { calculateFamilyEntropy, type SystemEntropyReport } from '@/lib/EntanglementLogic';
import { Activity, Users, AlertTriangle, CheckCircle, Zap } from 'lucide-react';

// Types
type WuXingElement = 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water';

interface CommandConsoleInnerProps {
  kIndex: number;
  yearElement: WuXingElement;
  monthElement?: WuXingElement;
}

// System Entropy Display Component
function SystemEntropyPanel({ entropyReport }: { entropyReport: SystemEntropyReport }) {
  const stressLevel = entropyReport.systemStressScore < 30 ? 'Low' :
    entropyReport.systemStressScore < 60 ? 'Moderate' : 'High';

  const stressColor = entropyReport.systemStressScore < 30 ? 'text-green-400' :
    entropyReport.systemStressScore < 60 ? 'text-yellow-400' : 'text-red-400';

  const stressBg = entropyReport.systemStressScore < 30 ? 'bg-green-950/30' :
    entropyReport.systemStressScore < 60 ? 'bg-yellow-950/30' : 'bg-red-950/30';

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-cyan-400 font-[family-name:var(--font-geist-mono)] uppercase tracking-wide">
            System Entanglement Matrix
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Family dynamics entropy analysis
          </p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded ${stressBg}`}>
          <Activity className={`w-4 h-4 ${stressColor}`} />
          <span className={`text-sm font-bold ${stressColor}`}>
            {stressLevel} Stress
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {/* Stress Score */}
        <div className="bg-gray-950 rounded p-3 border border-gray-800">
          <div className="text-xs text-gray-400 mb-1">Stress Score</div>
          <div className={`text-2xl font-bold font-mono ${stressColor}`}>
            {entropyReport.systemStressScore}
          </div>
          <div className="text-xs text-gray-500">/ 100</div>
        </div>

        {/* Stability Index */}
        <div className="bg-gray-950 rounded p-3 border border-gray-800">
          <div className="text-xs text-gray-400 mb-1">Stability</div>
          <div className="text-2xl font-bold font-mono text-blue-400">
            {(entropyReport.stabilityIndex * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-gray-500">index</div>
        </div>

        {/* Constructive Interactions */}
        <div className="bg-gray-950 rounded p-3 border border-green-900/30">
          <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-400" />
            Constructive
          </div>
          <div className="text-2xl font-bold font-mono text-green-400">
            {entropyReport.constructiveCount}
          </div>
          <div className="text-xs text-gray-500">pairs</div>
        </div>

        {/* Destructive Interactions */}
        <div className="bg-gray-950 rounded p-3 border border-red-900/30">
          <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            Destructive
          </div>
          <div className="text-2xl font-bold font-mono text-red-400">
            {entropyReport.destructiveCount}
          </div>
          <div className="text-xs text-gray-500">pairs</div>
        </div>
      </div>

      {/* Dominant Element */}
      {entropyReport.dominantElement && (
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
          <span>Dominant Element:</span>
          <span className="font-semibold text-cyan-400">{entropyReport.dominantElement}</span>
        </div>
      )}

      {/* Interaction Breakdown */}
      <div className="border-t border-gray-800 pt-3">
        <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
          Pairwise Interactions
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
          {entropyReport.interactions.slice(0, 6).map((interaction, idx) => (
            <div
              key={idx}
              className={`
                text-xs p-2 rounded border
                ${interaction.interactionType === 'Constructive' || interaction.interactionType === 'Same'
                  ? 'border-green-900/30 bg-green-950/20'
                  : interaction.interactionType === 'Destructive'
                  ? 'border-red-900/30 bg-red-950/20'
                  : 'border-gray-800 bg-gray-950/50'
                }
              `}
            >
              <div className="font-mono text-gray-300 truncate">
                {interaction.description}
              </div>
              <div className="text-gray-500 mt-0.5">
                Entropy: {interaction.entropyContribution}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Family Nodes Display
function FamilyNodesPanel() {
  const { all: nodes } = useFamilyMembers();

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-cyan-400 font-[family-name:var(--font-geist-mono)] uppercase tracking-wide">
          System Nodes
        </h3>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Users className="w-3 h-3" />
          <span>{nodes.length} members</span>
        </div>
      </div>

      <div className="space-y-2">
        {nodes.map((node) => (
          <div
            key={node.id}
            className="flex items-center justify-between py-2 px-3 bg-gray-950 rounded border border-gray-800"
          >
            <div className="flex items-center gap-3">
              <div className={`
                w-2 h-2 rounded-full
                ${node.role === 'Primary' ? 'bg-cyan-400' : 'bg-gray-500'}
              `} />
              <div>
                <div className="text-sm text-gray-200">{node.name}</div>
                <div className="text-xs text-gray-500">
                  {node.birthYear} • {node.zodiacSign.name}
                </div>
              </div>
            </div>
            <div className={`
              text-xs px-2 py-0.5 rounded
              ${node.zodiacSign.element === 'Fire' ? 'bg-orange-950/50 text-orange-400' :
                node.zodiacSign.element === 'Water' ? 'bg-blue-950/50 text-blue-400' :
                node.zodiacSign.element === 'Wood' ? 'bg-green-950/50 text-green-400' :
                node.zodiacSign.element === 'Metal' ? 'bg-slate-800/50 text-slate-300' :
                'bg-amber-950/50 text-amber-400'}
            `}>
              {node.zodiacSign.element}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Inner component that uses the context
function CommandConsoleInner({ kIndex, yearElement, monthElement }: CommandConsoleInnerProps) {
  const { state } = useSystemState();

  // Calculate system entropy from current nodes
  const entropyReport = calculateFamilyEntropy(state.nodes);

  return (
    <section className="bg-gray-950 border-t border-cyan-900/50 pt-6">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-800">
          <Zap className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-cyan-400 font-[family-name:var(--font-geist-mono)]">
            Command Console
          </h2>
          <p className="text-xs text-gray-500">
            System dynamics • Tactical protocols • Market resonance
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Left Column: System Entropy + Family Nodes */}
        <div className="space-y-4">
          <SystemEntropyPanel entropyReport={entropyReport} />
          <FamilyNodesPanel />
        </div>

        {/* Right Column: Tactical Deck + Market Sensor */}
        <div className="space-y-4">
          <TacticalDeck kIndex={kIndex} systemEntropy={entropyReport.systemStressScore} />
          <MarketSensor
            yearElement={yearElement}
            monthElement={monthElement}
            kIndex={kIndex}
          />
        </div>
      </div>

      {/* Console Footer */}
      <div className="text-center text-xs text-gray-600 pt-4 border-t border-gray-800">
        System Dynamics Layer v1.0 • Entanglement Matrix Active • {state.nodes.length} Nodes Tracked
      </div>
    </section>
  );
}

// Main export with Provider wrapper
export interface CommandConsoleProps {
  kIndex: number;
  yearElement?: WuXingElement;
  monthElement?: WuXingElement;
}

export function CommandConsole({
  kIndex,
  yearElement = 'Fire', // 2026 is Fire year
  monthElement,
}: CommandConsoleProps) {
  return (
    <SystemStateProvider>
      <CommandConsoleInner
        kIndex={kIndex}
        yearElement={yearElement}
        monthElement={monthElement}
      />
    </SystemStateProvider>
  );
}

export default CommandConsole;
