/**
 * HelioEngine: Evergreen Core Physics Engine
 *
 * Analyzes heliospheric interference patterns with Chinese Zodiac temporal cycles.
 * Now supports ANY date through integration with TimeDecoder's astronomically-accurate
 * solar position calculations.
 *
 * Scientific Framework:
 * - Resonance: Constructive interference between solar activity and zodiac cycles
 * - Damping: Destructive interference reducing system amplitude
 * - Phase coupling: Temporal alignment between heliospheric events and calendar cycles
 * - Environmental Vector: The current year's energetic signature (from TimeDecoder)
 */

import {
  TimeDecoder,
  timeDecoder,
  type ZodiacArchetype,
  type ElementType,
  type TemporalState
} from './TimeDecoder';

export interface ZodiacSign {
  name: string;
  element: ElementType;
  phase: number; // 0-360 degrees
}

export interface FamilyMember {
  name: string;
  birthYear: number;
  birthDate?: Date; // Optional for precise Li Chun calculation
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

export interface EnvironmentalVector {
  archetype: ZodiacArchetype;
  element: ElementType;
  phase: number;
  intensity: number;
  solarLongitude: number;
  solarTerm: string;
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
 * Uses TimeDecoder for accurate Li Chun-aware calculation when date provided
 */
export function getZodiacSign(birthYear: number, birthDate?: Date): ZodiacSign {
  if (birthDate) {
    const { archetype } = timeDecoder.getZodiacForBirthYear(birthYear, birthDate);
    return ZODIAC_SIGNS[archetype];
  }

  // Legacy fallback without precise date
  const signs = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake',
                 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];
  const offset = ((birthYear - 1900) % 12 + 12) % 12;
  const signName = signs[offset];
  return ZODIAC_SIGNS[signName];
}

/**
 * Get the Environmental Vector for a given date
 * This represents the "current year's energy" that interacts with birth charts
 */
export function getEnvironmentalVector(currentDate: Date): EnvironmentalVector {
  const temporalState = timeDecoder.getTemporalState(currentDate);
  const envVector = timeDecoder.getEnvironmentalVector(currentDate);

  return {
    archetype: envVector.archetype,
    element: envVector.element,
    phase: envVector.phase,
    intensity: envVector.intensity,
    solarLongitude: temporalState.solarLongitude,
    solarTerm: temporalState.currentSolarTerm.name,
  };
}

/**
 * Calculate interference pattern between a family member and the current environment
 * EVERGREEN: Now accepts currentDate to calculate against any point in time
 */
export function calculateInterference(
  familyMember: FamilyMember,
  helioState: HeliosphericState,
  currentDate: Date = new Date()
): InterferencePattern {
  // Get the environmental vector for the target date
  const envVector = getEnvironmentalVector(currentDate);
  const envSign = ZODIAC_SIGNS[envVector.archetype];
  const memberSign = familyMember.zodiacSign;

  // Phase difference in radians
  const phaseDelta = Math.abs(envSign.phase - memberSign.phase) * (Math.PI / 180);

  // Elemental coupling strength based on Wu Xing theory
  const elementalCoupling = calculateElementalCoupling(envSign.element, memberSign.element);

  // K-Index normalized (0-9 -> 0-1)
  const kIndexNormalized = helioState.kIndex / 9;

  // Environmental intensity modifier (varies through the year)
  const intensityMod = envVector.intensity;

  // Resonance Index: Constructive when phases align and K-Index is high
  const phaseAlignment = (Math.cos(phaseDelta) + 1) / 2;
  const resonanceIndex = phaseAlignment * elementalCoupling * kIndexNormalized * intensityMod;

  // Damping Coefficient: Increases with phase opposition and low solar activity
  const phaseMismatch = Math.sin(phaseDelta);
  const dampingCoefficient = phaseMismatch * (1 - elementalCoupling) * (1 - kIndexNormalized);

  // Phase Coherence: Overall system alignment
  const phaseCoherence = (phaseAlignment + elementalCoupling) / 2;

  // Harmonic Order: Discrete mode based on element interaction
  const harmonicOrder = calculateHarmonicOrder(envSign.element, memberSign.element);

  return {
    resonanceIndex: Math.max(0, Math.min(1, resonanceIndex)),
    dampingCoefficient: Math.max(0, Math.min(1, dampingCoefficient)),
    phaseCoherence: Math.max(0, Math.min(1, phaseCoherence)),
    harmonicOrder,
  };
}

/**
 * Legacy function for backwards compatibility
 * @deprecated Use calculateInterference with currentDate parameter instead
 */
export function calculateFireHorseInterference(
  familyMember: FamilyMember,
  helioState: HeliosphericState
): InterferencePattern {
  // Default to current date for backwards compatibility
  return calculateInterference(familyMember, helioState, new Date());
}

/**
 * Calculate elemental coupling strength based on Wu Xing (Five Elements) theory
 */
function calculateElementalCoupling(element1: ElementType, element2: ElementType): number {
  // Same element: Perfect coupling
  if (element1 === element2) return 1.0;

  // Generating cycle (mother-child): Wood->Fire->Earth->Metal->Water->Wood
  const generatingPairs: Record<string, ElementType> = {
    Wood: 'Fire',
    Fire: 'Earth',
    Earth: 'Metal',
    Metal: 'Water',
    Water: 'Wood',
  };

  // Overcoming cycle (controlling): Wood->Earth, Earth->Water, Water->Fire, Fire->Metal, Metal->Wood
  const overcomingPairs: Record<string, ElementType> = {
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
function calculateHarmonicOrder(element1: ElementType, element2: ElementType): number {
  const elementOrder: Record<ElementType, number> = {
    Fire: 1,
    Earth: 2,
    Metal: 3,
    Water: 4,
    Wood: 5,
  };

  const order1 = elementOrder[element1];
  const order2 = elementOrder[element2];

  return Math.abs(order1 - order2) + 1;
}

/**
 * Calculate aggregate family resonance field
 * EVERGREEN: Now accepts currentDate for temporal calibration
 */
export function calculateFamilyResonance(
  family: FamilyMember[],
  helioState: HeliosphericState,
  currentDate: Date = new Date()
): {
  totalResonance: number;
  totalDamping: number;
  coherenceField: number;
  individualPatterns: Array<{ member: FamilyMember; pattern: InterferencePattern }>;
  environmentalVector: EnvironmentalVector;
} {
  // Get current environmental state
  const environmentalVector = getEnvironmentalVector(currentDate);

  // Guard against empty family array to prevent division by zero
  if (family.length === 0) {
    return {
      totalResonance: 0,
      totalDamping: 0,
      coherenceField: 0,
      individualPatterns: [],
      environmentalVector,
    };
  }

  const patterns = family.map((member) => ({
    member,
    pattern: calculateInterference(member, helioState, currentDate),
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
    environmentalVector,
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

/**
 * Get temporal state summary for display
 */
export function getTemporalStateSummary(currentDate: Date = new Date()): {
  yearLabel: string;
  elementLabel: string;
  solarTermLabel: string;
  solarLongitudeLabel: string;
  dayOfYear: number;
} {
  const state = timeDecoder.getTemporalState(currentDate);

  return {
    yearLabel: `Year of the ${state.yearArchetype}`,
    elementLabel: `${state.yearElement} ${state.yearArchetype}`,
    solarTermLabel: `${state.currentSolarTerm.name} (${state.currentSolarTerm.meaning})`,
    solarLongitudeLabel: state.solarLongitudeFormatted,
    dayOfYear: state.dayOfEnergeticYear,
  };
}

// Re-export TimeDecoder types for convenience
export type { ZodiacArchetype, ElementType, TemporalState };
export { timeDecoder, TimeDecoder };
