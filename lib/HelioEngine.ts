/**
 * HelioEngine: Core logic for analyzing heliospheric interference patterns
 * with Chinese Zodiac temporal cycles (2026 Fire Horse year).
 * 
 * Scientific Framework:
 * - Resonance: Constructive interference between solar activity and zodiac cycles
 * - Damping: Destructive interference reducing system amplitude
 * - Phase coupling: Temporal alignment between heliospheric events and calendar cycles
 */

export interface ZodiacSign {
  name: string;
  element: 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water';
  phase: number; // 0-360 degrees
}

export interface FamilyMember {
  name: string;
  birthYear: number;
  zodiacSign: ZodiacSign;
}

export interface InterferencePattern {
  resonanceIndex: number; // 0-1, higher = stronger constructive interference
  dampingCoefficient: number; // 0-1, higher = stronger destructive interference
  phaseCoherence: number; // 0-1, alignment metric
  harmonicOrder: number; // Integer indicating harmonic mode
}

export interface HeliosphericState {
  kIndex: number; // NOAA K-Index (0-9)
  timestamp: Date;
}

/**
 * Chinese Zodiac signs with their elements and phase angles
 */
const ZODIAC_SIGNS: Record<string, ZodiacSign> = {
  Rat: { name: 'Rat', element: 'Water', phase: 0 },
  Ox: { name: 'Ox', element: 'Earth', phase: 30 },
  Tiger: { name: 'Tiger', element: 'Wood', phase: 60 },
  Rabbit: { name: 'Rabbit', element: 'Wood', phase: 90 },
  Dragon: { name: 'Dragon', element: 'Earth', phase: 120 },
  Snake: { name: 'Snake', element: 'Fire', phase: 150 },
  Horse: { name: 'Horse', element: 'Fire', phase: 180 },
  Goat: { name: 'Goat', element: 'Earth', phase: 210 },
  Monkey: { name: 'Monkey', element: 'Metal', phase: 240 },
  Rooster: { name: 'Rooster', element: 'Metal', phase: 270 },
  Dog: { name: 'Dog', element: 'Earth', phase: 300 },
  Pig: { name: 'Pig', element: 'Water', phase: 330 },
};

/**
 * Calculate Chinese Zodiac sign from birth year
 */
export function getZodiacSign(birthYear: number): ZodiacSign {
  const signs = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 
                 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];
  const offset = (birthYear - 1900) % 12;
  const signName = signs[offset];
  return ZODIAC_SIGNS[signName];
}

/**
 * Calculate Fire Horse interference pattern for 2026
 * Fire Horse (2026) acts as the carrier wave for interference calculations
 */
export function calculateFireHorseInterference(
  familyMember: FamilyMember,
  helioState: HeliosphericState
): InterferencePattern {
  const fireHorse = ZODIAC_SIGNS.Horse;
  const memberSign = familyMember.zodiacSign;
  
  // Phase difference in radians
  const phaseDelta = Math.abs(fireHorse.phase - memberSign.phase) * (Math.PI / 180);
  
  // Elemental coupling strength (Fire-Fire = 1.0, same element family = 0.8, opposite = 0.2)
  const elementalCoupling = calculateElementalCoupling(fireHorse.element, memberSign.element);
  
  // K-Index normalized (0-9 -> 0-1)
  const kIndexNormalized = helioState.kIndex / 9;
  
  // Resonance Index: Constructive when phases align and K-Index is high
  // Uses cosine of phase difference (1 when aligned, -1 when opposed)
  const phaseAlignment = (Math.cos(phaseDelta) + 1) / 2; // Normalize to 0-1
  const resonanceIndex = phaseAlignment * elementalCoupling * kIndexNormalized;
  
  // Damping Coefficient: Increases with phase opposition and low solar activity
  // Represents energy dissipation in the system
  const phaseMismatch = Math.sin(phaseDelta); // 0 when aligned, 1 at 90°
  const dampingCoefficient = phaseMismatch * (1 - elementalCoupling) * (1 - kIndexNormalized);
  
  // Phase Coherence: Overall system alignment
  const phaseCoherence = (phaseAlignment + elementalCoupling) / 2;
  
  // Harmonic Order: Discrete mode based on element interaction
  const harmonicOrder = calculateHarmonicOrder(fireHorse.element, memberSign.element);
  
  return {
    resonanceIndex: Math.max(0, Math.min(1, resonanceIndex)),
    dampingCoefficient: Math.max(0, Math.min(1, dampingCoefficient)),
    phaseCoherence: Math.max(0, Math.min(1, phaseCoherence)),
    harmonicOrder,
  };
}

/**
 * Calculate elemental coupling strength based on Wu Xing (Five Elements) theory
 */
function calculateElementalCoupling(element1: string, element2: string): number {
  // Same element: Perfect coupling
  if (element1 === element2) return 1.0;
  
  // Generating cycle (mother-child): Wood→Fire→Earth→Metal→Water→Wood
  const generatingPairs: Record<string, string> = {
    Wood: 'Fire',
    Fire: 'Earth',
    Earth: 'Metal',
    Metal: 'Water',
    Water: 'Wood',
  };
  
  // Overcoming cycle (controlling): Wood→Earth, Earth→Water, Water→Fire, Fire→Metal, Metal→Wood
  const overcomingPairs: Record<string, string> = {
    Wood: 'Earth',
    Earth: 'Water',
    Water: 'Fire',
    Fire: 'Metal',
    Metal: 'Wood',
  };
  
  if (generatingPairs[element1] === element2 || generatingPairs[element2] === element1) {
    return 0.8; // Strong coupling through generation
  }
  
  if (overcomingPairs[element1] === element2 || overcomingPairs[element2] === element1) {
    return 0.3; // Weak coupling through control
  }
  
  return 0.5; // Neutral relationship
}

/**
 * Determine harmonic order based on element pair
 */
function calculateHarmonicOrder(element1: string, element2: string): number {
  const elementOrder: Record<string, number> = {
    Fire: 1,
    Earth: 2,
    Metal: 3,
    Water: 4,
    Wood: 5,
  };
  
  const order1 = elementOrder[element1] || 0;
  const order2 = elementOrder[element2] || 0;
  
  return Math.abs(order1 - order2) + 1;
}

/**
 * Calculate aggregate family resonance field
 */
export function calculateFamilyResonance(
  family: FamilyMember[],
  helioState: HeliosphericState
): {
  totalResonance: number;
  totalDamping: number;
  coherenceField: number;
  individualPatterns: Array<{ member: FamilyMember; pattern: InterferencePattern }>;
} {
  const patterns = family.map((member) => ({
    member,
    pattern: calculateFireHorseInterference(member, helioState),
  }));
  
  // Sum of individual resonances
  const totalResonance = patterns.reduce((sum, p) => sum + p.pattern.resonanceIndex, 0) / family.length;
  
  // Sum of individual damping effects
  const totalDamping = patterns.reduce((sum, p) => sum + p.pattern.dampingCoefficient, 0) / family.length;
  
  // Coherence field: How well the family oscillates together
  const avgPhaseCoherence = patterns.reduce((sum, p) => sum + p.pattern.phaseCoherence, 0) / family.length;
  const coherenceVariance = patterns.reduce((sum, p) => {
    const diff = p.pattern.phaseCoherence - avgPhaseCoherence;
    return sum + diff * diff;
  }, 0) / family.length;
  
  const coherenceField = avgPhaseCoherence * (1 - Math.min(1, coherenceVariance));
  
  return {
    totalResonance: Math.max(0, Math.min(1, totalResonance)),
    totalDamping: Math.max(0, Math.min(1, totalDamping)),
    coherenceField: Math.max(0, Math.min(1, coherenceField)),
    individualPatterns: patterns,
  };
}

/**
 * Get interpretation label for metric values
 */
export function getMetricLabel(value: number, type: 'resonance' | 'damping' | 'coherence'): string {
  if (type === 'resonance') {
    if (value > 0.7) return 'Strong Constructive';
    if (value > 0.4) return 'Moderate Constructive';
    return 'Weak Constructive';
  }
  
  if (type === 'damping') {
    if (value > 0.7) return 'High Dissipation';
    if (value > 0.4) return 'Moderate Dissipation';
    return 'Low Dissipation';
  }
  
  // coherence
  if (value > 0.7) return 'Highly Coherent';
  if (value > 0.4) return 'Moderately Coherent';
  return 'Low Coherence';
}
