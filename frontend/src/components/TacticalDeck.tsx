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

const ELEMENT_COLORS: Record<CardElement, { border: string; bg: string; text: string }> = {
  Wood: { border: 'border-green-300', bg: 'bg-green-50', text: 'text-green-600' },
  Fire: { border: 'border-red-300', bg: 'bg-red-50', text: 'text-red-500' },
  Earth: { border: 'border-amber-300', bg: 'bg-amber-50', text: 'text-amber-600' },
  Metal: { border: 'border-slate-300', bg: 'bg-slate-50', text: 'text-slate-600' },
  Water: { border: 'border-blue-300', bg: 'bg-blue-50', text: 'text-blue-600' },
};

const RARITY_STYLES: Record<CardRarity, { border: string; badge: string }> = {
  Common: { border: 'border', badge: 'bg-slate-100 text-slate-600' },
  Rare: { border: 'border-2', badge: 'bg-blue-100 text-blue-700' },
  Legendary: { border: 'border-2 ring-2 ring-amber-200', badge: 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700' },
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
    <div className={`relative overflow-hidden rounded-xl p-4 ${elementStyle.bg} ${elementStyle.border} ${rarityStyle.border} shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}>
      <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium ${rarityStyle.badge}`}>{card.rarity}</div>
      <div className={`mb-3 ${elementStyle.text}`}>{card.icon}</div>
      <h4 className={`font-semibold text-sm mb-1 ${elementStyle.text}`}>{card.name}</h4>
      <div className="flex items-center gap-1 mb-2">
        <span className={elementStyle.text}>{ELEMENT_ICONS[card.element]}</span>
        <span className="text-xs text-slate-500">{card.element}</span>
      </div>
      <p className="text-xs text-slate-600 mb-2 line-clamp-2">{card.description}</p>
      <div className="mt-auto pt-2 border-t border-slate-200/50">
        <p className="text-xs font-medium text-blue-600">{card.effect}</p>
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
    Quiet: 'text-green-600',
    Unsettled: 'text-amber-600',
    Storm: 'text-orange-500',
    Severe: 'text-red-600',
  };

  const severityBg: Record<KIndexSeverity, string> = {
    Quiet: 'bg-green-50',
    Unsettled: 'bg-amber-50',
    Storm: 'bg-orange-50',
    Severe: 'bg-red-50',
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Recommended Actions</h3>
          <p className="text-xs text-slate-500 mt-0.5">Based on current conditions</p>
        </div>
        <div className={`text-right px-3 py-1 rounded-lg ${severityBg[severity]}`}>
          <div className={`text-xs font-semibold ${severityColors[severity]}`}>{severity.toUpperCase()}</div>
          <div className="text-xs text-slate-500">Kp {kIndex.toFixed(1)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {cards.map((card) => (
          <ProtocolCardComponent key={card.id} card={card} />
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100">
        <p className="text-xs text-slate-400 text-center">Suggestions based on space weather and elemental theory</p>
      </div>
    </div>
  );
}

export default TacticalDeck;
