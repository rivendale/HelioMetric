/**
 * HelioEngine: Evergreen Core Physics Engine
 *
 * Analyzes heliospheric interference patterns with Chinese Zodiac temporal cycles.
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
  phase: number;
}

export interface FamilyMember {
  name: string;
  birthYear: number;
  birthDate?: Date;
  zodiacSign: ZodiacSign;
}

export interface InterferencePattern {
  resonanceIndex: number;
  dampingCoefficient: number;
  phaseCoherence: number;
  harmonicOrder: number;
}

export interface HeliosphericState {
  kIndex: number;
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

export function getZodiacSign(birthYear: number, birthDate?: Date): ZodiacSign {
  if (birthDate) {
    const { archetype } = timeDecoder.getZodiacForBirthYear(birthYear, birthDate);
    return ZODIAC_SIGNS[archetype];
  }

  const signs = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake',
                 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];
  const offset = ((birthYear - 1900) % 12 + 12) % 12;
  const signName = signs[offset];
  return ZODIAC_SIGNS[signName];
}

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

export function calculateInterference(
  familyMember: FamilyMember,
  helioState: HeliosphericState,
  currentDate: Date = new Date()
): InterferencePattern {
  const envVector = getEnvironmentalVector(currentDate);
  const envSign = ZODIAC_SIGNS[envVector.archetype];
  const memberSign = familyMember.zodiacSign;

  const phaseDelta = Math.abs(envSign.phase - memberSign.phase) * (Math.PI / 180);
  const elementalCoupling = calculateElementalCoupling(envSign.element, memberSign.element);
  const kIndexNormalized = helioState.kIndex / 9;
  const intensityMod = envVector.intensity;

  const phaseAlignment = (Math.cos(phaseDelta) + 1) / 2;
  const resonanceIndex = phaseAlignment * elementalCoupling * kIndexNormalized * intensityMod;

  const phaseMismatch = Math.sin(phaseDelta);
  const dampingCoefficient = phaseMismatch * (1 - elementalCoupling) * (1 - kIndexNormalized);

  const phaseCoherence = (phaseAlignment + elementalCoupling) / 2;
  const harmonicOrder = calculateHarmonicOrder(envSign.element, memberSign.element);

  return {
    resonanceIndex: Math.max(0, Math.min(1, resonanceIndex)),
    dampingCoefficient: Math.max(0, Math.min(1, dampingCoefficient)),
    phaseCoherence: Math.max(0, Math.min(1, phaseCoherence)),
    harmonicOrder,
  };
}

function calculateElementalCoupling(element1: ElementType, element2: ElementType): number {
  if (element1 === element2) return 1.0;

  const generatingPairs: Record<string, ElementType> = {
    Wood: 'Fire',
    Fire: 'Earth',
    Earth: 'Metal',
    Metal: 'Water',
    Water: 'Wood',
  };

  const overcomingPairs: Record<string, ElementType> = {
    Wood: 'Earth',
    Earth: 'Water',
    Water: 'Fire',
    Fire: 'Metal',
    Metal: 'Wood',
  };

  if (generatingPairs[element1] === element2 || generatingPairs[element2] === element1) {
    return 0.8;
  }

  if (overcomingPairs[element1] === element2 || overcomingPairs[element2] === element1) {
    return 0.3;
  }

  return 0.5;
}

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
  const environmentalVector = getEnvironmentalVector(currentDate);

  const patterns = family.map((member) => ({
    member,
    pattern: calculateInterference(member, helioState, currentDate),
  }));

  const totalResonance = patterns.reduce((sum, p) => sum + p.pattern.resonanceIndex, 0) / family.length;
  const totalDamping = patterns.reduce((sum, p) => sum + p.pattern.dampingCoefficient, 0) / family.length;

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

  if (value > 0.7) return 'Highly Coherent';
  if (value > 0.4) return 'Moderately Coherent';
  return 'Low Coherence';
}

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

export type { ZodiacArchetype, ElementType, TemporalState };
export { timeDecoder, TimeDecoder };
