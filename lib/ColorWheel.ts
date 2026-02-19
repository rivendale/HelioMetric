/**
 * ColorWheel: MTG-inspired Philosophical Framework
 *
 * Implements the Magic: The Gathering five-color wheel as a personality/strategy
 * analysis system. Maps to both Wu Xing (Five Elements) and Western Zodiac systems
 * for comprehensive personality profiling.
 *
 * The Five Colors represent philosophical approaches to life:
 * - White (Plains): Peace through structure & community
 * - Blue (Island): Perfection through knowledge & control
 * - Black (Swamp): Power through ambition & pragmatism
 * - Red (Mountain): Freedom through passion & impulse
 * - Green (Forest): Harmony through growth & instinct
 *
 * No color is inherently "good" or "evil" - they're lenses for understanding
 * conflict, strategy, and personality.
 */

import type { ElementType, ZodiacArchetype } from './types';

// ============================================================================
// Core Color Types
// ============================================================================

export type ManaColor = 'White' | 'Blue' | 'Black' | 'Red' | 'Green';
export type ManaSymbol = '⚪' | '🔵' | '⚫' | '🔴' | '🟢';
export type LandType = 'Plains' | 'Island' | 'Swamp' | 'Mountain' | 'Forest';

export interface ColorPhilosophy {
  color: ManaColor;
  symbol: ManaSymbol;
  land: LandType;
  corePhilosophy: string;
  keyValues: string[];
  strategies: string[];
  flaws: string[];
  realWorldMappings: string[];
}

// ============================================================================
// Color Wheel Definitions
// ============================================================================

export const COLOR_PHILOSOPHIES: Record<ManaColor, ColorPhilosophy> = {
  White: {
    color: 'White',
    symbol: '⚪',
    land: 'Plains',
    corePhilosophy: 'Peace through structure & community',
    keyValues: ['Order', 'Protection', 'Equality', 'Healing', 'Unity'],
    strategies: ['Coalition building', 'Rule enforcement', 'Collective defense', 'Moral authority'],
    flaws: ['Stagnation', 'Oppression', 'Self-sacrifice', 'Inflexibility'],
    realWorldMappings: ['Law & order', 'Collectivism', 'Pacifism', 'Bureaucracy', 'Religion'],
  },
  Blue: {
    color: 'Blue',
    symbol: '🔵',
    land: 'Island',
    corePhilosophy: 'Perfection through knowledge & control',
    keyValues: ['Logic', 'Prediction', 'Technology', 'Patience', 'Mastery'],
    strategies: ['Information gathering', 'Counter-planning', 'Manipulation', 'Long-term thinking'],
    flaws: ['Arrogance', 'Paralysis by analysis', 'Emotional denial', 'Isolation'],
    realWorldMappings: ['Intellectualism', 'Science', 'Planning', 'Control systems', 'Academia'],
  },
  Black: {
    color: 'Black',
    symbol: '⚫',
    land: 'Swamp',
    corePhilosophy: 'Power through ambition & pragmatism',
    keyValues: ['Self-interest', 'Resourcefulness', 'Survival', 'Pragmatism', 'Independence'],
    strategies: ['Cost-benefit analysis', 'Opportunism', 'Resource acquisition', 'Strategic sacrifice'],
    flaws: ['Parasitism', 'Betrayal', 'Despair', 'Isolation', 'Short-sightedness'],
    realWorldMappings: ['Realpolitik', 'Capitalism', 'Nihilism', 'Survivalism', 'Machiavellianism'],
  },
  Red: {
    color: 'Red',
    symbol: '🔴',
    land: 'Mountain',
    corePhilosophy: 'Freedom through passion & impulse',
    keyValues: ['Emotion', 'Spontaneity', 'Action', 'Authenticity', 'Liberation'],
    strategies: ['Direct action', 'Emotional appeal', 'Disruption', 'Improvisation'],
    flaws: ['Recklessness', 'Short-sightedness', 'Destruction', 'Instability'],
    realWorldMappings: ['Anarchism', 'Hedonism', 'Rebellion', 'Artistry', 'Adrenaline seeking'],
  },
  Green: {
    color: 'Green',
    symbol: '🟢',
    land: 'Forest',
    corePhilosophy: 'Harmony through growth & instinct',
    keyValues: ['Nature', 'Acceptance', 'Tradition', 'Growth', 'Interconnection'],
    strategies: ['Resource accumulation', 'Natural development', 'Ancestral wisdom', 'Overwhelming force'],
    flaws: ['Resistance to change', 'Brutality', 'Overgrowth', 'Fatalism'],
    realWorldMappings: ['Environmentalism', 'Traditionalism', 'Fatalism', 'Primitivism', 'Tribalism'],
  },
};

// ============================================================================
// Color Relationships (The Wheel)
// ============================================================================

/**
 * The color wheel forms a pentagon: W → U → B → R → G → W
 * Adjacent colors are allies (shared philosophies)
 * Opposite colors are enemies (conflicting worldviews)
 */

export interface ColorRelationship {
  type: 'ally' | 'enemy' | 'neutral' | 'self';
  description: string;
  tensionLevel: number; // 0-1, higher = more conflict
}

/**
 * Allied pairs (adjacent on the wheel):
 * White-Blue: Control/Order (Azorius)
 * Blue-Black: Manipulation/Ambition (Dimir)
 * Black-Red: Destruction/Selfishness (Rakdos)
 * Red-Green: Instinct/Nature (Gruul)
 * Green-White: Community/Tradition (Selesnya)
 */
const ALLY_PAIRS: [ManaColor, ManaColor][] = [
  ['White', 'Blue'],
  ['Blue', 'Black'],
  ['Black', 'Red'],
  ['Red', 'Green'],
  ['Green', 'White'],
];

/**
 * Enemy pairs (opposite on the wheel):
 * White vs Black: Community vs Selfishness
 * Blue vs Red: Logic vs Passion
 * Blue vs Green: Artifice vs Nature
 * Black vs Green: Exploitation vs Harmony
 * Black vs White: Selfishness vs Community
 * Red vs White: Chaos vs Order
 */
const ENEMY_PAIRS: [ManaColor, ManaColor][] = [
  ['White', 'Black'],
  ['Blue', 'Red'],
  ['Blue', 'Green'],
  ['Black', 'Green'],
  ['Red', 'White'],
];

export function getColorRelationship(colorA: ManaColor, colorB: ManaColor): ColorRelationship {
  if (colorA === colorB) {
    return { type: 'self', description: 'Same philosophical alignment', tensionLevel: 0 };
  }

  const isAlly = ALLY_PAIRS.some(
    ([a, b]) => (a === colorA && b === colorB) || (a === colorB && b === colorA)
  );

  if (isAlly) {
    return {
      type: 'ally',
      description: getAllyDescription(colorA, colorB),
      tensionLevel: 0.2,
    };
  }

  const isEnemy = ENEMY_PAIRS.some(
    ([a, b]) => (a === colorA && b === colorB) || (a === colorB && b === colorA)
  );

  if (isEnemy) {
    return {
      type: 'enemy',
      description: getEnemyDescription(colorA, colorB),
      tensionLevel: 0.8,
    };
  }

  // Neutral (non-adjacent, non-opposite)
  return {
    type: 'neutral',
    description: 'Indirect philosophical connection',
    tensionLevel: 0.5,
  };
}

function getAllyDescription(colorA: ManaColor, colorB: ManaColor): string {
  const pair = [colorA, colorB].sort().join('-');
  const descriptions: Record<string, string> = {
    'Blue-White': 'Control through law and knowledge (Azorius)',
    'Black-Blue': 'Power through information and manipulation (Dimir)',
    'Black-Red': 'Freedom through destruction and self-interest (Rakdos)',
    'Green-Red': 'Authenticity through instinct and passion (Gruul)',
    'Green-White': 'Community through tradition and nature (Selesnya)',
  };
  return descriptions[pair] || 'Shared philosophical ground';
}

function getEnemyDescription(colorA: ManaColor, colorB: ManaColor): string {
  const pair = [colorA, colorB].sort().join('-');
  const descriptions: Record<string, string> = {
    'Black-White': 'Community vs Selfishness - fundamental conflict over priorities',
    'Blue-Red': 'Logic vs Passion - head battles heart',
    'Blue-Green': 'Artifice vs Nature - progress vs acceptance',
    'Black-Green': 'Exploitation vs Harmony - taking vs flowing',
    'Red-White': 'Chaos vs Order - freedom battles structure',
  };
  return descriptions[pair] || 'Opposing worldviews';
}

// ============================================================================
// Wu Xing to Color Mapping
// ============================================================================

/**
 * Maps Chinese Five Elements (Wu Xing) to MTG Colors
 *
 * Rationale:
 * - Metal (金) → White: Structure, purity, law, cutting through
 * - Water (水) → Blue: Wisdom, depth, adaptability, flow
 * - Earth (土) → Black: Grounding, absorption, pragmatism, resources
 * - Fire (火) → Red: Passion, destruction, energy, impulse
 * - Wood (木) → Green: Growth, vitality, nature, life
 */
export const WU_XING_TO_COLOR: Record<ElementType, ManaColor> = {
  Metal: 'White',
  Water: 'Blue',
  Earth: 'Black',
  Fire: 'Red',
  Wood: 'Green',
};

export const COLOR_TO_WU_XING: Record<ManaColor, ElementType> = {
  White: 'Metal',
  Blue: 'Water',
  Black: 'Earth',
  Red: 'Fire',
  Green: 'Wood',
};

/**
 * Get the MTG color for a Wu Xing element
 */
export function getColorFromElement(element: ElementType): ManaColor {
  return WU_XING_TO_COLOR[element];
}

/**
 * Get the Wu Xing element for an MTG color
 */
export function getElementFromColor(color: ManaColor): ElementType {
  return COLOR_TO_WU_XING[color];
}

// ============================================================================
// Western Zodiac to Color Mapping
// ============================================================================

export type WesternZodiac =
  | 'Aries'
  | 'Taurus'
  | 'Gemini'
  | 'Cancer'
  | 'Leo'
  | 'Virgo'
  | 'Libra'
  | 'Scorpio'
  | 'Sagittarius'
  | 'Capricorn'
  | 'Aquarius'
  | 'Pisces';

export type WesternElement = 'Fire' | 'Earth' | 'Air' | 'Water';
export type Modality = 'Cardinal' | 'Fixed' | 'Mutable';

export interface WesternZodiacInfo {
  sign: WesternZodiac;
  element: WesternElement;
  modality: Modality;
  dateRange: string;
  primaryColor: ManaColor;
  secondaryColor: ManaColor;
}

/**
 * Western Zodiac mapping with MTG color associations
 *
 * Primary color based on element:
 * - Fire signs → Red (passion, action)
 * - Earth signs → Black or Green (pragmatism, growth)
 * - Air signs → Blue or White (intellect, communication)
 * - Water signs → Blue (emotion, intuition)
 *
 * Secondary color based on modality:
 * - Cardinal → White (leadership, initiation)
 * - Fixed → Black (determination, stubbornness)
 * - Mutable → Blue (adaptability, flexibility)
 */
export const WESTERN_ZODIAC: Record<WesternZodiac, WesternZodiacInfo> = {
  Aries: {
    sign: 'Aries',
    element: 'Fire',
    modality: 'Cardinal',
    dateRange: 'Mar 21 - Apr 19',
    primaryColor: 'Red',
    secondaryColor: 'White',
  },
  Taurus: {
    sign: 'Taurus',
    element: 'Earth',
    modality: 'Fixed',
    dateRange: 'Apr 20 - May 20',
    primaryColor: 'Green',
    secondaryColor: 'Black',
  },
  Gemini: {
    sign: 'Gemini',
    element: 'Air',
    modality: 'Mutable',
    dateRange: 'May 21 - Jun 20',
    primaryColor: 'Blue',
    secondaryColor: 'Red',
  },
  Cancer: {
    sign: 'Cancer',
    element: 'Water',
    modality: 'Cardinal',
    dateRange: 'Jun 21 - Jul 22',
    primaryColor: 'Blue',
    secondaryColor: 'White',
  },
  Leo: {
    sign: 'Leo',
    element: 'Fire',
    modality: 'Fixed',
    dateRange: 'Jul 23 - Aug 22',
    primaryColor: 'Red',
    secondaryColor: 'White',
  },
  Virgo: {
    sign: 'Virgo',
    element: 'Earth',
    modality: 'Mutable',
    dateRange: 'Aug 23 - Sep 22',
    primaryColor: 'White',
    secondaryColor: 'Blue',
  },
  Libra: {
    sign: 'Libra',
    element: 'Air',
    modality: 'Cardinal',
    dateRange: 'Sep 23 - Oct 22',
    primaryColor: 'White',
    secondaryColor: 'Blue',
  },
  Scorpio: {
    sign: 'Scorpio',
    element: 'Water',
    modality: 'Fixed',
    dateRange: 'Oct 23 - Nov 21',
    primaryColor: 'Black',
    secondaryColor: 'Blue',
  },
  Sagittarius: {
    sign: 'Sagittarius',
    element: 'Fire',
    modality: 'Mutable',
    dateRange: 'Nov 22 - Dec 21',
    primaryColor: 'Red',
    secondaryColor: 'Green',
  },
  Capricorn: {
    sign: 'Capricorn',
    element: 'Earth',
    modality: 'Cardinal',
    dateRange: 'Dec 22 - Jan 19',
    primaryColor: 'Black',
    secondaryColor: 'White',
  },
  Aquarius: {
    sign: 'Aquarius',
    element: 'Air',
    modality: 'Fixed',
    dateRange: 'Jan 20 - Feb 18',
    primaryColor: 'Blue',
    secondaryColor: 'Red',
  },
  Pisces: {
    sign: 'Pisces',
    element: 'Water',
    modality: 'Mutable',
    dateRange: 'Feb 19 - Mar 20',
    primaryColor: 'Blue',
    secondaryColor: 'Green',
  },
};

/**
 * Get Western zodiac sign from birth date
 */
export function getWesternZodiac(birthDate: Date): WesternZodiacInfo {
  const month = birthDate.getMonth() + 1;
  const day = birthDate.getDate();

  const signs: [WesternZodiac, number, number, number, number][] = [
    ['Capricorn', 12, 22, 1, 19],
    ['Aquarius', 1, 20, 2, 18],
    ['Pisces', 2, 19, 3, 20],
    ['Aries', 3, 21, 4, 19],
    ['Taurus', 4, 20, 5, 20],
    ['Gemini', 5, 21, 6, 20],
    ['Cancer', 6, 21, 7, 22],
    ['Leo', 7, 23, 8, 22],
    ['Virgo', 8, 23, 9, 22],
    ['Libra', 9, 23, 10, 22],
    ['Scorpio', 10, 23, 11, 21],
    ['Sagittarius', 11, 22, 12, 21],
  ];

  for (const [sign, startMonth, startDay, endMonth, endDay] of signs) {
    if (
      (month === startMonth && day >= startDay) ||
      (month === endMonth && day <= endDay)
    ) {
      return WESTERN_ZODIAC[sign];
    }
  }

  return WESTERN_ZODIAC.Capricorn; // Fallback
}

// ============================================================================
// Chinese Zodiac to Color Mapping
// ============================================================================

/**
 * Maps Chinese Zodiac archetypes to MTG colors based on traditional
 * personality associations
 */
export const CHINESE_ZODIAC_COLORS: Record<ZodiacArchetype, { primary: ManaColor; secondary: ManaColor; traits: string[] }> = {
  Rat: {
    primary: 'Blue',
    secondary: 'Black',
    traits: ['Resourceful', 'Quick-witted', 'Opportunistic'],
  },
  Ox: {
    primary: 'Green',
    secondary: 'White',
    traits: ['Dependable', 'Strong', 'Determined'],
  },
  Tiger: {
    primary: 'Red',
    secondary: 'White',
    traits: ['Brave', 'Competitive', 'Unpredictable'],
  },
  Rabbit: {
    primary: 'White',
    secondary: 'Blue',
    traits: ['Gentle', 'Elegant', 'Diplomatic'],
  },
  Dragon: {
    primary: 'Red',
    secondary: 'Black',
    traits: ['Ambitious', 'Dominant', 'Charismatic'],
  },
  Snake: {
    primary: 'Black',
    secondary: 'Blue',
    traits: ['Wise', 'Mysterious', 'Strategic'],
  },
  Horse: {
    primary: 'Red',
    secondary: 'Green',
    traits: ['Free-spirited', 'Energetic', 'Independent'],
  },
  Goat: {
    primary: 'Green',
    secondary: 'White',
    traits: ['Creative', 'Gentle', 'Compassionate'],
  },
  Monkey: {
    primary: 'Blue',
    secondary: 'Red',
    traits: ['Clever', 'Curious', 'Playful'],
  },
  Rooster: {
    primary: 'White',
    secondary: 'Red',
    traits: ['Observant', 'Hardworking', 'Confident'],
  },
  Dog: {
    primary: 'White',
    secondary: 'Green',
    traits: ['Loyal', 'Honest', 'Protective'],
  },
  Pig: {
    primary: 'Green',
    secondary: 'Black',
    traits: ['Generous', 'Diligent', 'Compassionate'],
  },
};

// ============================================================================
// Multi-Color Identity (Color Pairs and Wedges)
// ============================================================================

export type GuildName =
  | 'Azorius'   // White-Blue
  | 'Dimir'     // Blue-Black
  | 'Rakdos'    // Black-Red
  | 'Gruul'     // Red-Green
  | 'Selesnya'  // Green-White
  | 'Orzhov'    // White-Black
  | 'Izzet'     // Blue-Red
  | 'Golgari'   // Black-Green
  | 'Boros'     // Red-White
  | 'Simic';    // Green-Blue

export interface ColorIdentity {
  colors: ManaColor[];
  name: string;
  philosophy: string;
  strengths: string[];
  weaknesses: string[];
}

export const GUILD_IDENTITIES: Record<GuildName, ColorIdentity> = {
  Azorius: {
    colors: ['White', 'Blue'],
    name: 'Azorius',
    philosophy: 'Perfect law creates perfect peace',
    strengths: ['Long-term planning', 'Institutional power', 'Rule-based solutions'],
    weaknesses: ['Slow to adapt', 'Can become tyrannical', 'Misses emotional needs'],
  },
  Dimir: {
    colors: ['Blue', 'Black'],
    name: 'Dimir',
    philosophy: 'Knowledge is the ultimate power',
    strengths: ['Information warfare', 'Strategic patience', 'Hidden influence'],
    weaknesses: ['Paranoia', 'Isolation', 'Trust issues'],
  },
  Rakdos: {
    colors: ['Black', 'Red'],
    name: 'Rakdos',
    philosophy: 'Live in the moment, consequences be damned',
    strengths: ['Fearlessness', 'Unpredictability', 'Raw power'],
    weaknesses: ['Self-destruction', 'Unreliability', 'Burned bridges'],
  },
  Gruul: {
    colors: ['Red', 'Green'],
    name: 'Gruul',
    philosophy: 'Follow your instincts, crush what stands in your way',
    strengths: ['Authenticity', 'Physical power', 'Emotional honesty'],
    weaknesses: ['Planning deficit', 'Collateral damage', 'Stubbornness'],
  },
  Selesnya: {
    colors: ['Green', 'White'],
    name: 'Selesnya',
    philosophy: 'The whole is greater than its parts',
    strengths: ['Community building', 'Sustainable growth', 'Harmony'],
    weaknesses: ['Groupthink', 'Slow progress', 'Resistance to change'],
  },
  Orzhov: {
    colors: ['White', 'Black'],
    name: 'Orzhov',
    philosophy: 'Order serves those who understand power',
    strengths: ['Resource accumulation', 'Debt leverage', 'Institutional corruption'],
    weaknesses: ['Greed', 'Exploitation', 'Rigid hierarchies'],
  },
  Izzet: {
    colors: ['Blue', 'Red'],
    name: 'Izzet',
    philosophy: 'Innovation through experimentation',
    strengths: ['Creativity', 'Problem-solving', 'Adaptability'],
    weaknesses: ['Inconsistency', 'Collateral damage', 'Unfinished projects'],
  },
  Golgari: {
    colors: ['Black', 'Green'],
    name: 'Golgari',
    philosophy: 'Life and death are one continuous cycle',
    strengths: ['Resilience', 'Resource recycling', 'Long-term thinking'],
    weaknesses: ['Morbidity', 'Stagnation', 'Exploitation of weak'],
  },
  Boros: {
    colors: ['Red', 'White'],
    name: 'Boros',
    philosophy: 'Justice through righteous action',
    strengths: ['Quick response', 'Moral clarity', 'Team coordination'],
    weaknesses: ['Black-and-white thinking', 'Aggression', 'Burnout'],
  },
  Simic: {
    colors: ['Green', 'Blue'],
    name: 'Simic',
    philosophy: 'Nature perfected through understanding',
    strengths: ['Adaptive growth', 'Scientific approach', 'Long-term improvement'],
    weaknesses: ['Playing god', 'Unintended consequences', 'Detachment'],
  },
};

/**
 * Find the guild identity for a color pair
 */
export function getGuildIdentity(colorA: ManaColor, colorB: ManaColor): ColorIdentity | null {
  for (const guild of Object.values(GUILD_IDENTITIES)) {
    if (
      (guild.colors[0] === colorA && guild.colors[1] === colorB) ||
      (guild.colors[0] === colorB && guild.colors[1] === colorA)
    ) {
      return guild;
    }
  }
  return null;
}

// ============================================================================
// Color Profile Generation
// ============================================================================

export interface ColorProfile {
  // Primary colors from different systems
  wuXingColor: ManaColor;
  westernPrimaryColor: ManaColor;
  westernSecondaryColor: ManaColor;
  chinesePrimaryColor: ManaColor;
  chineseSecondaryColor: ManaColor;

  // Aggregated color identity
  dominantColors: ManaColor[];
  colorIdentity: ColorIdentity | null;

  // Philosophical profile
  coreValues: string[];
  strategies: string[];
  blindSpots: string[];

  // Compatibility metrics
  allyColors: ManaColor[];
  enemyColors: ManaColor[];
}

/**
 * Generate a comprehensive color profile from zodiac data
 */
export function generateColorProfile(
  chineseArchetype: ZodiacArchetype,
  wuXingElement: ElementType,
  westernZodiac: WesternZodiacInfo
): ColorProfile {
  const wuXingColor = getColorFromElement(wuXingElement);
  const chineseColors = CHINESE_ZODIAC_COLORS[chineseArchetype];

  // Collect all color votes
  const colorVotes: Record<ManaColor, number> = {
    White: 0,
    Blue: 0,
    Black: 0,
    Red: 0,
    Green: 0,
  };

  // Weight: Wu Xing element (strongest)
  colorVotes[wuXingColor] += 3;

  // Weight: Chinese zodiac primary
  colorVotes[chineseColors.primary] += 2;
  colorVotes[chineseColors.secondary] += 1;

  // Weight: Western zodiac
  colorVotes[westernZodiac.primaryColor] += 2;
  colorVotes[westernZodiac.secondaryColor] += 1;

  // Sort colors by votes
  const sortedColors = (Object.entries(colorVotes) as [ManaColor, number][])
    .sort((a, b) => b[1] - a[1]);

  const dominantColors = sortedColors
    .filter(([, votes]) => votes >= 2)
    .map(([color]) => color)
    .slice(0, 3);

  // Try to find a guild identity
  let colorIdentity: ColorIdentity | null = null;
  if (dominantColors.length >= 2) {
    colorIdentity = getGuildIdentity(dominantColors[0], dominantColors[1]);
  }

  // Aggregate values and strategies from dominant colors
  const coreValues: string[] = [];
  const strategies: string[] = [];
  const blindSpots: string[] = [];

  dominantColors.forEach((color) => {
    const philosophy = COLOR_PHILOSOPHIES[color];
    coreValues.push(...philosophy.keyValues.slice(0, 2));
    strategies.push(...philosophy.strategies.slice(0, 2));
    blindSpots.push(...philosophy.flaws.slice(0, 2));
  });

  // Find ally and enemy colors
  const allyColors: ManaColor[] = [];
  const enemyColors: ManaColor[] = [];

  dominantColors.forEach((color) => {
    ALLY_PAIRS.forEach(([a, b]) => {
      if (a === color && !allyColors.includes(b)) allyColors.push(b);
      if (b === color && !allyColors.includes(a)) allyColors.push(a);
    });
    ENEMY_PAIRS.forEach(([a, b]) => {
      if (a === color && !enemyColors.includes(b)) enemyColors.push(b);
      if (b === color && !enemyColors.includes(a)) enemyColors.push(a);
    });
  });

  return {
    wuXingColor,
    westernPrimaryColor: westernZodiac.primaryColor,
    westernSecondaryColor: westernZodiac.secondaryColor,
    chinesePrimaryColor: chineseColors.primary,
    chineseSecondaryColor: chineseColors.secondary,
    dominantColors,
    colorIdentity,
    coreValues: [...new Set(coreValues)],
    strategies: [...new Set(strategies)],
    blindSpots: [...new Set(blindSpots)],
    allyColors: allyColors.filter((c) => !dominantColors.includes(c)),
    enemyColors: enemyColors.filter((c) => !dominantColors.includes(c)),
  };
}

// ============================================================================
// Compatibility Analysis
// ============================================================================

export interface ColorCompatibility {
  overallScore: number; // 0-100
  relationship: 'Harmonious' | 'Complementary' | 'Challenging' | 'Opposing';
  sharedColors: ManaColor[];
  conflictingColors: [ManaColor, ManaColor][];
  analysis: string;
  recommendations: string[];
}

/**
 * Analyze compatibility between two color profiles
 */
export function analyzeColorCompatibility(
  profileA: ColorProfile,
  profileB: ColorProfile
): ColorCompatibility {
  // Find shared colors
  const sharedColors = profileA.dominantColors.filter((c) =>
    profileB.dominantColors.includes(c)
  );

  // Find conflicting color pairs
  const conflictingColors: [ManaColor, ManaColor][] = [];
  profileA.dominantColors.forEach((colorA) => {
    profileB.dominantColors.forEach((colorB) => {
      const relationship = getColorRelationship(colorA, colorB);
      if (relationship.type === 'enemy') {
        conflictingColors.push([colorA, colorB]);
      }
    });
  });

  // Calculate score
  const sharedBonus = sharedColors.length * 20;
  const conflictPenalty = conflictingColors.length * 25;
  const overallScore = Math.max(0, Math.min(100, 50 + sharedBonus - conflictPenalty));

  // Determine relationship type
  let relationship: ColorCompatibility['relationship'];
  if (overallScore >= 75) {
    relationship = 'Harmonious';
  } else if (overallScore >= 50) {
    relationship = 'Complementary';
  } else if (overallScore >= 25) {
    relationship = 'Challenging';
  } else {
    relationship = 'Opposing';
  }

  // Generate analysis
  let analysis = '';
  if (sharedColors.length > 0) {
    analysis += `Shared philosophical ground in ${sharedColors.join(', ')}. `;
  }
  if (conflictingColors.length > 0) {
    const conflicts = conflictingColors.map(([a, b]) => `${a}/${b}`).join(', ');
    analysis += `Tension points: ${conflicts}. `;
  }
  if (relationship === 'Harmonious') {
    analysis += 'Strong natural alignment.';
  } else if (relationship === 'Opposing') {
    analysis += 'Fundamental worldview differences require conscious bridging.';
  }

  // Generate recommendations
  const recommendations: string[] = [];
  if (conflictingColors.length > 0) {
    conflictingColors.forEach(([colorA, colorB]) => {
      // Find a bridging color
      const bridgeColors = (Object.keys(COLOR_PHILOSOPHIES) as ManaColor[]).filter((c) => {
        const relA = getColorRelationship(c, colorA);
        const relB = getColorRelationship(c, colorB);
        return relA.type === 'ally' && relB.type === 'ally';
      });
      if (bridgeColors.length > 0) {
        recommendations.push(
          `Bridge ${colorA}/${colorB} tension through ${bridgeColors[0]} activities`
        );
      }
    });
  }

  return {
    overallScore,
    relationship,
    sharedColors,
    conflictingColors,
    analysis,
    recommendations,
  };
}
