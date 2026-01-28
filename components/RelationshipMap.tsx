'use client';

import React, { useMemo, useState } from 'react';
import { useSystemState, RELATIONSHIP_LABELS, type FamilyNode } from '@/context/SystemState';
import { calculateCompatibility } from '@/data/zodiac';
import { calculateWesternCompatibility } from '@/data/western-zodiac';
import { calculateFamilyEntropy } from '@/lib/EntanglementLogic';
import { Sun, Moon, GitCompareArrows } from 'lucide-react';

type CompatSystem = 'chinese' | 'western' | 'combined';

interface PairCompatibility {
  nodeA: FamilyNode;
  nodeB: FamilyNode;
  chinese: { score: number; relationship: string; description: string };
  western: { score: number; relationship: string; description: string } | null;
  combined: number;
}

function getScoreColor(score: number): string {
  if (score >= 85) return 'text-green-400';
  if (score >= 70) return 'text-emerald-400';
  if (score >= 55) return 'text-yellow-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
}

function getScoreBg(score: number): string {
  if (score >= 85) return 'bg-green-950/30 border-green-900/40';
  if (score >= 70) return 'bg-emerald-950/30 border-emerald-900/40';
  if (score >= 55) return 'bg-yellow-950/30 border-yellow-900/40';
  if (score >= 40) return 'bg-orange-950/30 border-orange-900/40';
  return 'bg-red-950/30 border-red-900/40';
}

function getScoreLabel(score: number): string {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 55) return 'Moderate';
  if (score >= 40) return 'Challenging';
  return 'Difficult';
}

function ScoreBadge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' }) {
  const color = getScoreColor(score);
  const sizeClass = size === 'sm' ? 'text-sm w-10 h-10' : 'text-lg w-14 h-14';
  return (
    <div className={`${sizeClass} rounded-full flex items-center justify-center font-bold font-mono ${color} bg-gray-950 border border-gray-700`}>
      {score}
    </div>
  );
}

function PairCard({ pair, system }: { pair: PairCompatibility; system: CompatSystem }) {
  const [expanded, setExpanded] = useState(false);

  const score = system === 'chinese' ? pair.chinese.score
    : system === 'western' && pair.western ? pair.western.score
    : pair.combined;

  const relationship = system === 'chinese' ? pair.chinese.relationship
    : system === 'western' && pair.western ? pair.western.relationship
    : pair.chinese.relationship;

  const description = system === 'chinese' ? pair.chinese.description
    : system === 'western' && pair.western ? pair.western.description
    : pair.chinese.description;

  return (
    <div
      className={`rounded-lg border p-4 cursor-pointer transition-all ${getScoreBg(score)} hover:ring-1 hover:ring-gray-600`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <ScoreBadge score={score} size="sm" />
          <div className="min-w-0">
            <div className="font-semibold text-gray-100 text-sm truncate">
              {pair.nodeA.name} & {pair.nodeB.name}
            </div>
            <div className="text-xs text-gray-500">
              {RELATIONSHIP_LABELS[pair.nodeA.relationship]} + {RELATIONSHIP_LABELS[pair.nodeB.relationship]}
            </div>
          </div>
        </div>
        <div className="text-right ml-2 shrink-0">
          <div className={`text-xs font-semibold ${getScoreColor(score)}`}>
            {getScoreLabel(score)}
          </div>
          <div className="text-xs text-gray-500">{relationship}</div>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-800 space-y-2">
          {/* Chinese Zodiac */}
          <div className="flex items-center gap-2 text-xs">
            <Moon className="w-3 h-3 text-red-400" />
            <span className="text-gray-400">Chinese:</span>
            <span className="text-gray-200">
              {pair.nodeA.zodiacSign.name} ({pair.nodeA.zodiacSign.element})
              {' & '}
              {pair.nodeB.zodiacSign.name} ({pair.nodeB.zodiacSign.element})
            </span>
            <span className={`ml-auto font-mono ${getScoreColor(pair.chinese.score)}`}>
              {pair.chinese.score}
            </span>
          </div>

          {/* Western Zodiac */}
          {pair.western && (
            <div className="flex items-center gap-2 text-xs">
              <Sun className="w-3 h-3 text-indigo-400" />
              <span className="text-gray-400">Western:</span>
              <span className="text-gray-200">
                {pair.nodeA.westernZodiac?.name || '?'}
                {' & '}
                {pair.nodeB.westernZodiac?.name || '?'}
              </span>
              <span className={`ml-auto font-mono ${getScoreColor(pair.western.score)}`}>
                {pair.western.score}
              </span>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-2">{description}</p>
        </div>
      )}
    </div>
  );
}

function CompatibilityGrid({ nodes, system }: { nodes: FamilyNode[]; system: CompatSystem }) {
  const getScore = (a: FamilyNode, b: FamilyNode): number => {
    if (a.id === b.id) return 100;
    const chinese = calculateCompatibility(a.zodiacSign.name, b.zodiacSign.name);
    if (system === 'chinese') return chinese.score;
    if (system === 'western' && a.westernZodiac && b.westernZodiac) {
      return calculateWesternCompatibility(a.westernZodiac.name, b.westernZodiac.name).score;
    }
    // Combined
    const western = a.westernZodiac && b.westernZodiac
      ? calculateWesternCompatibility(a.westernZodiac.name, b.westernZodiac.name).score
      : null;
    return western !== null ? Math.round((chinese.score + western) / 2) : chinese.score;
  };

  if (nodes.length < 2) return null;
  if (nodes.length > 8) {
    return (
      <p className="text-xs text-gray-500 text-center py-4">
        Grid view available for up to 8 people. Use the list view for larger groups.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="p-1"></th>
            {nodes.map((n) => (
              <th key={n.id} className="p-1 text-gray-400 font-normal truncate max-w-[80px]" title={n.name}>
                {n.name.slice(0, 8)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {nodes.map((row) => (
            <tr key={row.id}>
              <td className="p-1 text-gray-400 font-medium truncate max-w-[80px]" title={row.name}>
                {row.name.slice(0, 8)}
              </td>
              {nodes.map((col) => {
                const score = getScore(row, col);
                const isSelf = row.id === col.id;
                return (
                  <td key={col.id} className="p-1">
                    <div
                      className={`
                        w-full text-center py-1.5 rounded font-mono font-bold
                        ${isSelf ? 'bg-gray-800 text-gray-500' : getScoreColor(score)}
                      `}
                      style={!isSelf ? {
                        backgroundColor: score >= 85 ? 'rgba(34,197,94,0.15)'
                          : score >= 70 ? 'rgba(52,211,153,0.12)'
                          : score >= 55 ? 'rgba(234,179,8,0.12)'
                          : score >= 40 ? 'rgba(249,115,22,0.12)'
                          : 'rgba(239,68,68,0.12)',
                      } : undefined}
                    >
                      {isSelf ? '-' : score}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RelationshipMap() {
  const { state } = useSystemState();
  const [system, setSystem] = useState<CompatSystem>('combined');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const pairs = useMemo((): PairCompatibility[] => {
    const results: PairCompatibility[] = [];
    const nodes = state.nodes;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];

        const chinese = calculateCompatibility(a.zodiacSign.name, b.zodiacSign.name);

        let western = null;
        if (a.westernZodiac && b.westernZodiac) {
          western = calculateWesternCompatibility(a.westernZodiac.name, b.westernZodiac.name);
        }

        const combined = western
          ? Math.round((chinese.score + western.score) / 2)
          : chinese.score;

        results.push({ nodeA: a, nodeB: b, chinese, western, combined });
      }
    }

    // Sort by score descending
    const sortKey = system === 'chinese' ? 'chinese' : system === 'western' ? 'western' : 'combined';
    results.sort((a, b) => {
      const scoreA = sortKey === 'combined' ? a.combined
        : sortKey === 'western' && a.western ? a.western.score
        : a.chinese.score;
      const scoreB = sortKey === 'combined' ? b.combined
        : sortKey === 'western' && b.western ? b.western.score
        : b.chinese.score;
      return scoreB - scoreA;
    });

    return results;
  }, [state.nodes, system]);

  // System entropy summary
  const entropy = useMemo(() => {
    if (state.nodes.length < 2) return null;
    return calculateFamilyEntropy(state.nodes);
  }, [state.nodes]);

  if (state.nodes.length < 2) {
    return (
      <section className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-cyan-400 font-[family-name:var(--font-geist-mono)] mb-3">
          Relationship Compatibility
        </h2>
        <div className="text-center py-8">
          <GitCompareArrows className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Add at least 2 people to see compatibility.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className="text-xl font-bold text-cyan-400 font-[family-name:var(--font-geist-mono)]">
          Relationship Compatibility
        </h2>

        <div className="flex gap-2 flex-wrap">
          {/* System Toggle */}
          <div className="flex bg-gray-950 rounded-lg border border-gray-700 p-0.5">
            <button
              onClick={() => setSystem('combined')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                system === 'combined' ? 'bg-cyan-900/50 text-cyan-300' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Combined
            </button>
            <button
              onClick={() => setSystem('chinese')}
              className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-all ${
                system === 'chinese' ? 'bg-red-900/40 text-red-300' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Moon className="w-3 h-3" /> Chinese
            </button>
            <button
              onClick={() => setSystem('western')}
              className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-all ${
                system === 'western' ? 'bg-indigo-900/40 text-indigo-300' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Sun className="w-3 h-3" /> Western
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex bg-gray-950 rounded-lg border border-gray-700 p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                viewMode === 'list' ? 'bg-gray-700 text-gray-200' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                viewMode === 'grid' ? 'bg-gray-700 text-gray-200' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Grid
            </button>
          </div>
        </div>
      </div>

      {/* Entropy Summary */}
      {entropy && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
          <div className="bg-gray-950 rounded p-2 text-center border border-gray-800">
            <div className="text-xs text-gray-500">Stress</div>
            <div className={`text-lg font-bold font-mono ${
              entropy.systemStressScore < 30 ? 'text-green-400' :
              entropy.systemStressScore < 60 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {entropy.systemStressScore}
            </div>
          </div>
          <div className="bg-gray-950 rounded p-2 text-center border border-gray-800">
            <div className="text-xs text-gray-500">Stability</div>
            <div className="text-lg font-bold font-mono text-blue-400">
              {(entropy.stabilityIndex * 100).toFixed(0)}%
            </div>
          </div>
          <div className="bg-gray-950 rounded p-2 text-center border border-green-900/30">
            <div className="text-xs text-gray-500">Constructive</div>
            <div className="text-lg font-bold font-mono text-green-400">
              {entropy.constructiveCount}
            </div>
          </div>
          <div className="bg-gray-950 rounded p-2 text-center border border-red-900/30">
            <div className="text-xs text-gray-500">Destructive</div>
            <div className="text-lg font-bold font-mono text-red-400">
              {entropy.destructiveCount}
            </div>
          </div>
        </div>
      )}

      {/* View Content */}
      {viewMode === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pairs.map((pair, idx) => (
            <PairCard key={idx} pair={pair} system={system} />
          ))}
        </div>
      ) : (
        <CompatibilityGrid nodes={state.nodes} system={system} />
      )}
    </section>
  );
}
