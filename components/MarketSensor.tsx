'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus, Zap, Shield, Flame, Droplets, TreePine, Mountain, Gem } from 'lucide-react';

// Element type
type WuXingElement = 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water';

// Asset correlation types
export type AssetSignal = 'Momentum' | 'Accumulate' | 'Hold' | 'Distribute' | 'Avoid';

export interface AssetCorrelation {
  ticker: string;
  name: string;
  element: WuXingElement;
  signal: AssetSignal;
  resonanceScore: number; // 0-100
  rationale: string;
}

export interface MarketSensorProps {
  yearElement: WuXingElement;
  monthElement?: WuXingElement;
  kIndex: number;
}

// Element to Asset Class mappings
const ELEMENT_ASSET_MAP: Record<WuXingElement, AssetCorrelation[]> = {
  Fire: [
    { ticker: 'XLK', name: 'Tech Sector', element: 'Fire', signal: 'Momentum', resonanceScore: 85, rationale: 'Fire year amplifies innovation sectors' },
    { ticker: 'COPX', name: 'Copper Miners', element: 'Fire', signal: 'Momentum', resonanceScore: 78, rationale: 'Electrical conductivity resonates with Fire' },
    { ticker: 'ARKK', name: 'Innovation ETF', element: 'Fire', signal: 'Momentum', resonanceScore: 72, rationale: 'Disruptive energy aligns with Fire dynamics' },
  ],
  Earth: [
    { ticker: 'XLRE', name: 'Real Estate', element: 'Earth', signal: 'Accumulate', resonanceScore: 82, rationale: 'Earth energy stabilizes property values' },
    { ticker: 'XLU', name: 'Utilities', element: 'Earth', signal: 'Accumulate', resonanceScore: 76, rationale: 'Steady foundation aligns with Earth' },
    { ticker: 'LAND', name: 'Farmland REIT', element: 'Earth', signal: 'Accumulate', resonanceScore: 88, rationale: 'Direct Earth element resonance' },
  ],
  Metal: [
    { ticker: 'GLD', name: 'Gold', element: 'Metal', signal: 'Accumulate', resonanceScore: 90, rationale: 'Pure Metal element correlation' },
    { ticker: 'SLV', name: 'Silver', element: 'Metal', signal: 'Accumulate', resonanceScore: 85, rationale: 'Secondary Metal resonance' },
    { ticker: 'XME', name: 'Metals & Mining', element: 'Metal', signal: 'Accumulate', resonanceScore: 80, rationale: 'Sector-wide Metal alignment' },
  ],
  Water: [
    { ticker: 'PHO', name: 'Water Resources', element: 'Water', signal: 'Momentum', resonanceScore: 86, rationale: 'Direct Water element play' },
    { ticker: 'XLF', name: 'Financials', element: 'Water', signal: 'Hold', resonanceScore: 65, rationale: 'Liquidity flows correlate with Water' },
    { ticker: 'BND', name: 'Bond Aggregate', element: 'Water', signal: 'Accumulate', resonanceScore: 70, rationale: 'Fixed income flows like Water' },
  ],
  Wood: [
    { ticker: 'WOOD', name: 'Timber ETF', element: 'Wood', signal: 'Accumulate', resonanceScore: 88, rationale: 'Direct Wood element correlation' },
    { ticker: 'XLV', name: 'Healthcare', element: 'Wood', signal: 'Momentum', resonanceScore: 75, rationale: 'Growth and vitality align with Wood' },
    { ticker: 'XLY', name: 'Consumer Disc.', element: 'Wood', signal: 'Hold', resonanceScore: 68, rationale: 'Growth spending resonates with Wood' },
  ],
};

// Counter-element mappings (elements that oppose the current)
const OPPOSING_ELEMENTS: Record<WuXingElement, WuXingElement> = {
  Fire: 'Water',  // Water controls Fire
  Water: 'Earth', // Earth controls Water
  Earth: 'Wood',  // Wood controls Earth
  Wood: 'Metal',  // Metal controls Wood
  Metal: 'Fire',  // Fire controls Metal
};

// Signal styling
const SIGNAL_STYLES: Record<AssetSignal, { color: string; bg: string; icon: React.ReactNode }> = {
  Momentum: {
    color: 'text-green-400',
    bg: 'bg-green-950/50',
    icon: <TrendingUp className="w-3 h-3" />
  },
  Accumulate: {
    color: 'text-blue-400',
    bg: 'bg-blue-950/50',
    icon: <TrendingUp className="w-3 h-3" />
  },
  Hold: {
    color: 'text-yellow-400',
    bg: 'bg-yellow-950/50',
    icon: <Minus className="w-3 h-3" />
  },
  Distribute: {
    color: 'text-orange-400',
    bg: 'bg-orange-950/50',
    icon: <TrendingDown className="w-3 h-3" />
  },
  Avoid: {
    color: 'text-red-400',
    bg: 'bg-red-950/50',
    icon: <TrendingDown className="w-3 h-3" />
  },
};

// Element icons
const ELEMENT_ICONS: Record<WuXingElement, React.ReactNode> = {
  Wood: <TreePine className="w-3 h-3" />,
  Fire: <Flame className="w-3 h-3" />,
  Earth: <Mountain className="w-3 h-3" />,
  Metal: <Gem className="w-3 h-3" />,
  Water: <Droplets className="w-3 h-3" />,
};

// Element colors
const ELEMENT_COLORS: Record<WuXingElement, string> = {
  Wood: 'text-green-400',
  Fire: 'text-orange-400',
  Earth: 'text-amber-400',
  Metal: 'text-slate-300',
  Water: 'text-blue-400',
};

// Calculate resonant assets based on current elements
function calculateResonantAssets(
  yearElement: WuXingElement,
  monthElement?: WuXingElement,
  kIndex: number = 3
): AssetCorrelation[] {
  const resonantAssets: AssetCorrelation[] = [];

  // Get year element assets (primary resonance)
  const yearAssets = ELEMENT_ASSET_MAP[yearElement].map((asset) => ({
    ...asset,
    resonanceScore: Math.min(100, asset.resonanceScore + (kIndex > 5 ? 10 : 0)),
  }));
  resonantAssets.push(...yearAssets);

  // Get month element assets if different (secondary resonance)
  if (monthElement && monthElement !== yearElement) {
    const monthAssets = ELEMENT_ASSET_MAP[monthElement].map((asset) => ({
      ...asset,
      resonanceScore: Math.round(asset.resonanceScore * 0.8), // 80% weight for month
      signal: asset.signal === 'Momentum' ? 'Accumulate' : asset.signal,
    }));
    resonantAssets.push(...monthAssets.slice(0, 2));
  }

  // Identify assets to avoid (opposing element)
  const opposingElement = OPPOSING_ELEMENTS[yearElement];
  const opposingAssets = ELEMENT_ASSET_MAP[opposingElement].map((asset) => ({
    ...asset,
    signal: 'Avoid' as AssetSignal,
    resonanceScore: Math.max(0, 100 - asset.resonanceScore),
    rationale: `${opposingElement} opposes ${yearElement} year energy`,
  }));
  resonantAssets.push(opposingAssets[0]); // Add top opposing asset

  // Sort by resonance score
  return resonantAssets.sort((a, b) => b.resonanceScore - a.resonanceScore);
}

// Asset Row Component
function AssetRow({ asset }: { asset: AssetCorrelation }) {
  const signalStyle = SIGNAL_STYLES[asset.signal];
  const elementColor = ELEMENT_COLORS[asset.element];

  return (
    <div className={`
      flex items-center justify-between py-2 px-3 rounded
      ${signalStyle.bg} border border-gray-800/50
      hover:border-gray-700 transition-colors
    `}>
      <div className="flex items-center gap-3">
        {/* Ticker */}
        <div className="w-12">
          <span className="font-mono text-sm font-bold text-gray-100">
            {asset.ticker}
          </span>
        </div>

        {/* Element indicator */}
        <div className={`${elementColor}`}>
          {ELEMENT_ICONS[asset.element]}
        </div>

        {/* Name */}
        <div className="hidden sm:block">
          <span className="text-xs text-gray-400">{asset.name}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Resonance Score */}
        <div className="w-12 text-right">
          <span className={`text-xs font-mono ${
            asset.resonanceScore > 70 ? 'text-green-400' :
            asset.resonanceScore > 40 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {asset.resonanceScore}%
          </span>
        </div>

        {/* Signal */}
        <div className={`
          flex items-center gap-1 px-2 py-0.5 rounded
          ${signalStyle.color} bg-gray-900/50
        `}>
          {signalStyle.icon}
          <span className="text-xs font-semibold">{asset.signal}</span>
        </div>
      </div>
    </div>
  );
}

// Volatility indicator based on K-Index
function VolatilityIndicator({ kIndex }: { kIndex: number }) {
  const level = kIndex < 3 ? 'Low' : kIndex < 5 ? 'Moderate' : kIndex < 7 ? 'High' : 'Extreme';
  const color = kIndex < 3 ? 'text-green-400' : kIndex < 5 ? 'text-yellow-400' : kIndex < 7 ? 'text-orange-400' : 'text-red-400';
  const bgColor = kIndex < 3 ? 'bg-green-950/30' : kIndex < 5 ? 'bg-yellow-950/30' : kIndex < 7 ? 'bg-orange-950/30' : 'bg-red-950/30';

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded ${bgColor}`}>
      <Zap className={`w-4 h-4 ${color}`} />
      <div>
        <div className={`text-xs font-semibold ${color}`}>{level} Volatility</div>
        <div className="text-xs text-gray-500">Kp {kIndex.toFixed(1)} influence</div>
      </div>
    </div>
  );
}

// Main MarketSensor Component
export function MarketSensor({ yearElement, monthElement, kIndex }: MarketSensorProps) {
  const resonantAssets = calculateResonantAssets(yearElement, monthElement, kIndex);

  // Separate into categories
  const topPicks = resonantAssets.filter((a) => a.signal !== 'Avoid').slice(0, 4);
  const avoidList = resonantAssets.filter((a) => a.signal === 'Avoid');

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-cyan-400 font-[family-name:var(--font-geist-mono)] uppercase tracking-wide">
            Market Resonance Sensor
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Element-correlated asset signals
          </p>
        </div>

        {/* Current Element Display */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-2 py-1 rounded bg-gray-800 ${ELEMENT_COLORS[yearElement]}`}>
            {ELEMENT_ICONS[yearElement]}
            <span className="text-xs font-semibold">{yearElement} Year</span>
          </div>
          {monthElement && monthElement !== yearElement && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded bg-gray-800/50 ${ELEMENT_COLORS[monthElement]}`}>
              {ELEMENT_ICONS[monthElement]}
              <span className="text-xs">{monthElement} Mo</span>
            </div>
          )}
        </div>
      </div>

      {/* Volatility Indicator */}
      <div className="mb-4">
        <VolatilityIndicator kIndex={kIndex} />
      </div>

      {/* Resonant Assets */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-green-400" />
          <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
            Resonant Assets
          </span>
        </div>
        <div className="space-y-1.5">
          {topPicks.map((asset) => (
            <AssetRow key={asset.ticker} asset={asset} />
          ))}
        </div>
      </div>

      {/* Avoid List */}
      {avoidList.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-red-400" />
            <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
              Counter-Resonant
            </span>
          </div>
          <div className="space-y-1.5">
            {avoidList.map((asset) => (
              <AssetRow key={asset.ticker} asset={asset} />
            ))}
          </div>
        </div>
      )}

      {/* Footer Disclaimer */}
      <div className="mt-4 pt-3 border-t border-gray-800">
        <p className="text-xs text-gray-600 text-center">
          Correlations based on Wu Xing elemental theory • Not financial advice
        </p>
      </div>
    </div>
  );
}

export default MarketSensor;
