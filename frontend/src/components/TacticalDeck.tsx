import { Shield, Zap, Anchor, Flame, Droplets, TreePine, Mountain, Gem } from 'lucide-react';

type CardElement = 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water';
type CardRarity = 'Common' | 'Rare' | 'Legendary';
type KIndexSeverity = 'Quiet' | 'Unsettled' | 'Storm' | 'Severe';

interface ProtocolCard {
  id: string;
  name: string;
  element: CardElement;
  rarity: CardRarity;
  description: string;
  effect: string;
  icon: React.ReactNode;
}

function getKIndexSeverity(kIndex: number): KIndexSeverity {
  if (kIndex < 3) return 'Quiet';
  if (kIndex < 5) return 'Unsettled';
  if (kIndex < 7) return 'Storm';
  return 'Severe';
}

const ELEMENT_COLORS: Record<CardElement, { border: string; bg: string; text: string; glow: string }> = {
  Wood: { border: 'border-green-500', bg: 'bg-green-950/50', text: 'text-green-400', glow: 'shadow-green-500/20' },
  Fire: { border: 'border-orange-500', bg: 'bg-orange-950/50', text: 'text-orange-400', glow: 'shadow-orange-500/20' },
  Earth: { border: 'border-amber-500', bg: 'bg-amber-950/50', text: 'text-amber-400', glow: 'shadow-amber-500/20' },
  Metal: { border: 'border-slate-400', bg: 'bg-slate-950/50', text: 'text-slate-300', glow: 'shadow-slate-400/20' },
  Water: { border: 'border-blue-500', bg: 'bg-blue-950/50', text: 'text-blue-400', glow: 'shadow-blue-500/20' },
};

const RARITY_STYLES: Record<CardRarity, { border: string; badge: string }> = {
  Common: { border: 'border-2', badge: 'bg-gray-700 text-gray-300' },
  Rare: { border: 'border-2 border-opacity-100', badge: 'bg-blue-900 text-blue-300' },
  Legendary: { border: 'border-2 border-opacity-100 ring-2 ring-yellow-500/30', badge: 'bg-gradient-to-r from-yellow-900 to-amber-800 text-yellow-300' },
};

const ELEMENT_ICONS: Record<CardElement, React.ReactNode> = {
  Wood: <TreePine className="w-4 h-4" />,
  Fire: <Flame className="w-4 h-4" />,
  Earth: <Mountain className="w-4 h-4" />,
  Metal: <Gem className="w-4 h-4" />,
  Water: <Droplets className="w-4 h-4" />,
};

const PROTOCOL_CARDS: Record<string, ProtocolCard> = {
  groundingAnchor: { id: 'grounding-anchor', name: 'Grounding Anchor', element: 'Earth', rarity: 'Rare', description: 'Stabilizes chaotic Fire energy during geomagnetic storms.', effect: 'Reduces system entropy by dampening high-frequency oscillations.', icon: <Anchor className="w-8 h-8" /> },
  stabilityMatrix: { id: 'stability-matrix', name: 'Stability Matrix', element: 'Earth', rarity: 'Common', description: 'Creates a foundation for balanced interactions.', effect: '+15% coherence field strength.', icon: <Shield className="w-8 h-8" /> },
  mountainResilience: { id: 'mountain-resilience', name: 'Mountain Resilience', element: 'Earth', rarity: 'Legendary', description: 'Immovable presence that absorbs destructive interference.', effect: 'Nullifies one destructive element interaction.', icon: <Mountain className="w-8 h-8" /> },
  calmingTide: { id: 'calming-tide', name: 'Calming Tide', element: 'Water', rarity: 'Common', description: 'Soothes overactive Fire elements with gentle flow.', effect: '-20% Fire-related entropy.', icon: <Droplets className="w-8 h-8" /> },
  deepCurrents: { id: 'deep-currents', name: 'Deep Currents', element: 'Water', rarity: 'Rare', description: 'Channels emotional undercurrents into productive flow.', effect: 'Converts 1 Destructive interaction to Neutral.', icon: <Droplets className="w-8 h-8" /> },
  conductiveShield: { id: 'conductive-shield', name: 'Conductive Shield', element: 'Metal', rarity: 'Rare', description: 'Redirects excess energy through structured channels.', effect: 'Absorbs K-Index spike effects for 3 hours.', icon: <Shield className="w-8 h-8" /> },
  renewalBurst: { id: 'renewal-burst', name: 'Renewal Burst', element: 'Wood', rarity: 'Common', description: 'Fresh perspective brings new growth opportunities.', effect: '+25% constructive interaction strength.', icon: <TreePine className="w-8 h-8" /> },
  flexibleBamboo: { id: 'flexible-bamboo', name: 'Flexible Bamboo', element: 'Wood', rarity: 'Rare', description: 'Bends without breaking under pressure.', effect: 'Reduces damping coefficient by 15%.', icon: <TreePine className="w-8 h-8" /> },
  controlledBurn: { id: 'controlled-burn', name: 'Controlled Burn', element: 'Fire', rarity: 'Rare', description: 'Harnesses excess Fire energy productively.', effect: 'Converts high K-Index to +30% resonance.', icon: <Flame className="w-8 h-8" /> },
  sparkOfClarity: { id: 'spark-of-clarity', name: 'Spark of Clarity', element: 'Fire', rarity: 'Legendary', description: 'Illuminates hidden patterns in the system.', effect: 'Reveals optimal timing for important decisions.', icon: <Zap className="w-8 h-8" /> },
};

function selectProtocolCards(kIndex: number): ProtocolCard[] {
  const severity = getKIndexSeverity(kIndex);
  switch (severity) {
    case 'Severe': return [PROTOCOL_CARDS.mountainResilience, PROTOCOL_CARDS.groundingAnchor, PROTOCOL_CARDS.deepCurrents];
    case 'Storm': return [PROTOCOL_CARDS.groundingAnchor, PROTOCOL_CARDS.calmingTide, PROTOCOL_CARDS.conductiveShield];
    case 'Unsettled': return [PROTOCOL_CARDS.stabilityMatrix, PROTOCOL_CARDS.flexibleBamboo, PROTOCOL_CARDS.calmingTide];
    default: return [PROTOCOL_CARDS.renewalBurst, PROTOCOL_CARDS.sparkOfClarity, PROTOCOL_CARDS.controlledBurn];
  }
}

function ProtocolCardComponent({ card }: { card: ProtocolCard }) {
  const elementStyle = ELEMENT_COLORS[card.element];
  const rarityStyle = RARITY_STYLES[card.rarity];

  return (
    <div className={`relative overflow-hidden rounded-lg p-4 ${elementStyle.bg} ${elementStyle.border} ${rarityStyle.border} shadow-lg ${elementStyle.glow} transition-all duration-300 hover:scale-105 cursor-pointer`}>
      <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-semibold ${rarityStyle.badge}`}>{card.rarity}</div>
      <div className={`mb-3 ${elementStyle.text}`}>{card.icon}</div>
      <h4 className={`font-bold text-sm mb-1 ${elementStyle.text}`}>{card.name}</h4>
      <div className="flex items-center gap-1 mb-2">
        <span className={elementStyle.text}>{ELEMENT_ICONS[card.element]}</span>
        <span className="text-xs text-gray-400">{card.element}</span>
      </div>
      <p className="text-xs text-gray-400 mb-2 line-clamp-2">{card.description}</p>
      <div className="mt-auto pt-2 border-t border-gray-700/50">
        <p className="text-xs font-mono text-cyan-400">{card.effect}</p>
      </div>
    </div>
  );
}

export interface TacticalDeckProps {
  kIndex: number;
}

export function TacticalDeck({ kIndex }: TacticalDeckProps) {
  const cards = selectProtocolCards(kIndex);
  const severity = getKIndexSeverity(kIndex);

  const severityColors: Record<KIndexSeverity, string> = {
    Quiet: 'text-emerald-400',
    Unsettled: 'text-yellow-400',
    Storm: 'text-orange-400',
    Severe: 'text-red-400',
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-cyan-400 font-mono uppercase tracking-wide">Tactical Protocol Deck</h3>
          <p className="text-xs text-gray-500 mt-0.5">Today's recommended interventions</p>
        </div>
        <div className="text-right">
          <div className={`text-xs font-semibold ${severityColors[severity]}`}>{severity.toUpperCase()} CONDITIONS</div>
          <div className="text-xs text-gray-500">Kp {kIndex.toFixed(1)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {cards.map((card) => (
          <ProtocolCardComponent key={card.id} card={card} />
        ))}
      </div>

      <div className="mt-3 text-center">
        <p className="text-xs text-gray-600">Cards selected based on current space weather and system dynamics</p>
      </div>
    </div>
  );
}

export default TacticalDeck;
