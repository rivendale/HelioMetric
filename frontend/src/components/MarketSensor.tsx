import React from 'react';
import { TrendingUp, TrendingDown, Minus, Zap, Shield, Flame, Droplets, TreePine, Mountain, Gem } from 'lucide-react';

type WuXingElement = 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water';
type AssetSignal = 'Momentum' | 'Accumulate' | 'Hold' | 'Distribute' | 'Avoid';

interface AssetCorrelation {
  ticker: string;
  name: string;
  element: WuXingElement;
  signal: AssetSignal;
  resonanceScore: number;
  rationale: string;
}

export interface MarketSensorProps {
  yearElement: WuXingElement;
  monthElement?: WuXingElement;
  kIndex: number;
}

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

const OPPOSING_ELEMENTS: Record<WuXingElement, WuXingElement> = {
  Fire: 'Water',
  Water: 'Earth',
  Earth: 'Wood',
  Wood: 'Metal',
  Metal: 'Fire',
};

const SIGNAL_STYLES: Record<AssetSignal, { color: string; bg: string; icon: React.ReactNode }> = {
  Momentum: { color: 'text-green-600', bg: 'bg-green-50', icon: <TrendingUp className="w-3 h-3" /> },
  Accumulate: { color: 'text-blue-600', bg: 'bg-blue-50', icon: <TrendingUp className="w-3 h-3" /> },
  Hold: { color: 'text-amber-600', bg: 'bg-amber-50', icon: <Minus className="w-3 h-3" /> },
  Distribute: { color: 'text-orange-500', bg: 'bg-orange-50', icon: <TrendingDown className="w-3 h-3" /> },
  Avoid: { color: 'text-red-500', bg: 'bg-red-50', icon: <TrendingDown className="w-3 h-3" /> },
};

const ELEMENT_ICONS: Record<WuXingElement, React.ReactNode> = {
  Wood: <TreePine className="w-3 h-3" />,
  Fire: <Flame className="w-3 h-3" />,
  Earth: <Mountain className="w-3 h-3" />,
  Metal: <Gem className="w-3 h-3" />,
  Water: <Droplets className="w-3 h-3" />,
};

const ELEMENT_COLORS: Record<WuXingElement, string> = {
  Wood: 'text-green-500',
  Fire: 'text-red-500',
  Earth: 'text-amber-600',
  Metal: 'text-slate-500',
  Water: 'text-blue-500',
};

function calculateResonantAssets(yearElement: WuXingElement, kIndex: number): AssetCorrelation[] {
  const resonantAssets: AssetCorrelation[] = [];
  const yearAssets = ELEMENT_ASSET_MAP[yearElement].map((asset) => ({
    ...asset,
    resonanceScore: Math.min(100, asset.resonanceScore + (kIndex > 5 ? 10 : 0)),
  }));
  resonantAssets.push(...yearAssets);

  const opposingElement = OPPOSING_ELEMENTS[yearElement];
  const opposingAssets = ELEMENT_ASSET_MAP[opposingElement].map((asset) => ({
    ...asset,
    signal: 'Avoid' as AssetSignal,
    resonanceScore: Math.max(0, 100 - asset.resonanceScore),
    rationale: `${opposingElement} opposes ${yearElement} year energy`,
  }));
  resonantAssets.push(opposingAssets[0]);

  return resonantAssets.sort((a, b) => b.resonanceScore - a.resonanceScore);
}

function AssetRow({ asset }: { asset: AssetCorrelation }) {
  const signalStyle = SIGNAL_STYLES[asset.signal];
  const elementColor = ELEMENT_COLORS[asset.element];

  return (
    <div className={`flex items-center justify-between py-2 px-3 rounded-lg ${signalStyle.bg} border border-slate-100 hover:shadow-sm transition-shadow`}>
      <div className="flex items-center gap-3">
        <div className="w-12">
          <span className="font-mono text-sm font-bold text-slate-800">{asset.ticker}</span>
        </div>
        <div className={elementColor}>{ELEMENT_ICONS[asset.element]}</div>
        <div className="hidden sm:block">
          <span className="text-xs text-slate-600">{asset.name}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-12 text-right">
          <span className={`text-xs font-mono ${asset.resonanceScore > 70 ? 'text-green-600' : asset.resonanceScore > 40 ? 'text-amber-600' : 'text-red-500'}`}>
            {asset.resonanceScore}%
          </span>
        </div>
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${signalStyle.color} ${signalStyle.bg}`}>
          {signalStyle.icon}
          <span className="text-xs font-medium">{asset.signal}</span>
        </div>
      </div>
    </div>
  );
}

function VolatilityIndicator({ kIndex }: { kIndex: number }) {
  const level = kIndex < 3 ? 'Low' : kIndex < 5 ? 'Moderate' : kIndex < 7 ? 'High' : 'Extreme';
  const color = kIndex < 3 ? 'text-green-600' : kIndex < 5 ? 'text-amber-600' : kIndex < 7 ? 'text-orange-500' : 'text-red-600';
  const bgColor = kIndex < 3 ? 'bg-green-50' : kIndex < 5 ? 'bg-amber-50' : kIndex < 7 ? 'bg-orange-50' : 'bg-red-50';

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${bgColor}`}>
      <Zap className={`w-4 h-4 ${color}`} />
      <div>
        <div className={`text-xs font-medium ${color}`}>{level} Volatility</div>
        <div className="text-xs text-slate-500">Kp {kIndex.toFixed(1)} influence</div>
      </div>
    </div>
  );
}

export function MarketSensor({ yearElement, kIndex }: MarketSensorProps) {
  const resonantAssets = calculateResonantAssets(yearElement, kIndex);
  const topPicks = resonantAssets.filter((a) => a.signal !== 'Avoid').slice(0, 4);
  const avoidList = resonantAssets.filter((a) => a.signal === 'Avoid');

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Market Correlations</h3>
          <p className="text-xs text-slate-500 mt-0.5">Element-based asset signals</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 ${ELEMENT_COLORS[yearElement]}`}>
            {ELEMENT_ICONS[yearElement]}
            <span className="text-xs font-medium">{yearElement} Year</span>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <VolatilityIndicator kIndex={kIndex} />
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-green-500" />
          <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">Favorable Assets</span>
        </div>
        <div className="space-y-1.5">
          {topPicks.map((asset) => (
            <AssetRow key={asset.ticker} asset={asset} />
          ))}
        </div>
      </div>

      {avoidList.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-red-500" />
            <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">Unfavorable</span>
          </div>
          <div className="space-y-1.5">
            {avoidList.map((asset) => (
              <AssetRow key={asset.ticker} asset={asset} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-slate-100">
        <p className="text-xs text-slate-400 text-center">Based on Wu Xing elemental theory - Not financial advice</p>
      </div>
    </div>
  );
}

export default MarketSensor;
