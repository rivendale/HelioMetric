/**
 * Enriched Chinese Zodiac Data
 *
 * Comprehensive dataset for the 12 Chinese Zodiac animals including:
 * - Fixed elements (intrinsic to each sign)
 * - Yin/Yang polarity
 * - Earthly Branch associations (hour, month, direction)
 * - Trine groupings (compatibility clusters)
 * - Visual representations (emoji, unicode)
 * - The complete 60-year Sexagenary cycle
 *
 * Data sourced and consolidated from traditional Chinese astrology.
 */

import type { ElementType } from '../lib/TimeDecoder';

export type Polarity = 'Yang' | 'Yin';
export type TrineGroup = 1 | 2 | 3 | 4;
export type Direction = 'North' | 'Northeast' | 'East' | 'Southeast' | 'South' | 'Southwest' | 'West' | 'Northwest';
export type Season = 'Winter' | 'Spring' | 'Summer' | 'Autumn' | 'Late Summer';

export interface ZodiacAnimal {
  // Core identity
  name: string;
  emoji: string;
  unicode: string; // Unicode character for the Earthly Branch

  // Elemental associations
  fixedElement: ElementType; // Intrinsic element (doesn't change yearly)
  polarity: Polarity; // Yin or Yang

  // Temporal associations (Earthly Branches / Di Zhi)
  earthlyBranch: string; // Chinese character
  earthlyBranchPinyin: string;
  branchNumber: number; // 1-12

  // Hour association (Shichen - 2-hour periods)
  hourStart: number; // 24-hour format
  hourEnd: number;
  hourName: string; // Traditional name

  // Month association (lunar months)
  lunarMonth: number; // 1-12
  gregorianMonthApprox: string; // Approximate Gregorian equivalent

  // Directional and seasonal
  direction: Direction;
  season: Season;

  // Compatibility groupings
  trineGroup: TrineGroup; // 1-4, signs in same trine are most compatible
  secretFriend: string; // The "secret friend" zodiac
  conflictSign: string; // The opposing/clash sign

  // Personality keywords (for interpretive displays)
  traits: string[];
}

/**
 * The 12 Chinese Zodiac Animals with enriched metadata
 */
export const ZODIAC_ANIMALS: ZodiacAnimal[] = [
  {
    name: 'Rat',
    emoji: '🐀',
    unicode: '子',
    fixedElement: 'Water',
    polarity: 'Yang',
    earthlyBranch: '子',
    earthlyBranchPinyin: 'Zi',
    branchNumber: 1,
    hourStart: 23,
    hourEnd: 1,
    hourName: 'Zi Shi',
    lunarMonth: 11,
    gregorianMonthApprox: 'December',
    direction: 'North',
    season: 'Winter',
    trineGroup: 1,
    secretFriend: 'Ox',
    conflictSign: 'Horse',
    traits: ['Resourceful', 'Quick-witted', 'Versatile', 'Ambitious'],
  },
  {
    name: 'Ox',
    emoji: '🐂',
    unicode: '丑',
    fixedElement: 'Earth',
    polarity: 'Yin',
    earthlyBranch: '丑',
    earthlyBranchPinyin: 'Chou',
    branchNumber: 2,
    hourStart: 1,
    hourEnd: 3,
    hourName: 'Chou Shi',
    lunarMonth: 12,
    gregorianMonthApprox: 'January',
    direction: 'Northeast',
    season: 'Winter',
    trineGroup: 2,
    secretFriend: 'Rat',
    conflictSign: 'Goat',
    traits: ['Dependable', 'Strong', 'Determined', 'Patient'],
  },
  {
    name: 'Tiger',
    emoji: '🐅',
    unicode: '寅',
    fixedElement: 'Wood',
    polarity: 'Yang',
    earthlyBranch: '寅',
    earthlyBranchPinyin: 'Yin',
    branchNumber: 3,
    hourStart: 3,
    hourEnd: 5,
    hourName: 'Yin Shi',
    lunarMonth: 1,
    gregorianMonthApprox: 'February',
    direction: 'Northeast',
    season: 'Spring',
    trineGroup: 3,
    secretFriend: 'Pig',
    conflictSign: 'Monkey',
    traits: ['Brave', 'Competitive', 'Confident', 'Charismatic'],
  },
  {
    name: 'Rabbit',
    emoji: '🐇',
    unicode: '卯',
    fixedElement: 'Wood',
    polarity: 'Yin',
    earthlyBranch: '卯',
    earthlyBranchPinyin: 'Mao',
    branchNumber: 4,
    hourStart: 5,
    hourEnd: 7,
    hourName: 'Mao Shi',
    lunarMonth: 2,
    gregorianMonthApprox: 'March',
    direction: 'East',
    season: 'Spring',
    trineGroup: 4,
    secretFriend: 'Dog',
    conflictSign: 'Rooster',
    traits: ['Gentle', 'Elegant', 'Alert', 'Compassionate'],
  },
  {
    name: 'Dragon',
    emoji: '🐉',
    unicode: '辰',
    fixedElement: 'Earth',
    polarity: 'Yang',
    earthlyBranch: '辰',
    earthlyBranchPinyin: 'Chen',
    branchNumber: 5,
    hourStart: 7,
    hourEnd: 9,
    hourName: 'Chen Shi',
    lunarMonth: 3,
    gregorianMonthApprox: 'April',
    direction: 'Southeast',
    season: 'Spring',
    trineGroup: 1,
    secretFriend: 'Rooster',
    conflictSign: 'Dog',
    traits: ['Ambitious', 'Energetic', 'Fearless', 'Charismatic'],
  },
  {
    name: 'Snake',
    emoji: '🐍',
    unicode: '巳',
    fixedElement: 'Fire',
    polarity: 'Yin',
    earthlyBranch: '巳',
    earthlyBranchPinyin: 'Si',
    branchNumber: 6,
    hourStart: 9,
    hourEnd: 11,
    hourName: 'Si Shi',
    lunarMonth: 4,
    gregorianMonthApprox: 'May',
    direction: 'Southeast',
    season: 'Late Summer',
    trineGroup: 2,
    secretFriend: 'Monkey',
    conflictSign: 'Pig',
    traits: ['Intelligent', 'Wise', 'Graceful', 'Intuitive'],
  },
  {
    name: 'Horse',
    emoji: '🐎',
    unicode: '午',
    fixedElement: 'Fire',
    polarity: 'Yang',
    earthlyBranch: '午',
    earthlyBranchPinyin: 'Wu',
    branchNumber: 7,
    hourStart: 11,
    hourEnd: 13,
    hourName: 'Wu Shi',
    lunarMonth: 5,
    gregorianMonthApprox: 'June',
    direction: 'South',
    season: 'Summer',
    trineGroup: 3,
    secretFriend: 'Goat',
    conflictSign: 'Rat',
    traits: ['Energetic', 'Independent', 'Impatient', 'Free-spirited'],
  },
  {
    name: 'Goat',
    emoji: '🐐',
    unicode: '未',
    fixedElement: 'Earth',
    polarity: 'Yin',
    earthlyBranch: '未',
    earthlyBranchPinyin: 'Wei',
    branchNumber: 8,
    hourStart: 13,
    hourEnd: 15,
    hourName: 'Wei Shi',
    lunarMonth: 6,
    gregorianMonthApprox: 'July',
    direction: 'Southwest',
    season: 'Summer',
    trineGroup: 4,
    secretFriend: 'Horse',
    conflictSign: 'Ox',
    traits: ['Calm', 'Gentle', 'Creative', 'Sympathetic'],
  },
  {
    name: 'Monkey',
    emoji: '🐒',
    unicode: '申',
    fixedElement: 'Metal',
    polarity: 'Yang',
    earthlyBranch: '申',
    earthlyBranchPinyin: 'Shen',
    branchNumber: 9,
    hourStart: 15,
    hourEnd: 17,
    hourName: 'Shen Shi',
    lunarMonth: 7,
    gregorianMonthApprox: 'August',
    direction: 'Southwest',
    season: 'Autumn',
    trineGroup: 1,
    secretFriend: 'Snake',
    conflictSign: 'Tiger',
    traits: ['Clever', 'Curious', 'Mischievous', 'Inventive'],
  },
  {
    name: 'Rooster',
    emoji: '🐓',
    unicode: '酉',
    fixedElement: 'Metal',
    polarity: 'Yin',
    earthlyBranch: '酉',
    earthlyBranchPinyin: 'You',
    branchNumber: 10,
    hourStart: 17,
    hourEnd: 19,
    hourName: 'You Shi',
    lunarMonth: 8,
    gregorianMonthApprox: 'September',
    direction: 'West',
    season: 'Autumn',
    trineGroup: 2,
    secretFriend: 'Dragon',
    conflictSign: 'Rabbit',
    traits: ['Observant', 'Hardworking', 'Courageous', 'Confident'],
  },
  {
    name: 'Dog',
    emoji: '🐕',
    unicode: '戌',
    fixedElement: 'Earth',
    polarity: 'Yang',
    earthlyBranch: '戌',
    earthlyBranchPinyin: 'Xu',
    branchNumber: 11,
    hourStart: 19,
    hourEnd: 21,
    hourName: 'Xu Shi',
    lunarMonth: 9,
    gregorianMonthApprox: 'October',
    direction: 'Northwest',
    season: 'Autumn',
    trineGroup: 3,
    secretFriend: 'Rabbit',
    conflictSign: 'Dragon',
    traits: ['Loyal', 'Honest', 'Prudent', 'Reliable'],
  },
  {
    name: 'Pig',
    emoji: '🐖',
    unicode: '亥',
    fixedElement: 'Water',
    polarity: 'Yin',
    earthlyBranch: '亥',
    earthlyBranchPinyin: 'Hai',
    branchNumber: 12,
    hourStart: 21,
    hourEnd: 23,
    hourName: 'Hai Shi',
    lunarMonth: 10,
    gregorianMonthApprox: 'November',
    direction: 'Northwest',
    season: 'Winter',
    trineGroup: 4,
    secretFriend: 'Tiger',
    conflictSign: 'Snake',
    traits: ['Compassionate', 'Generous', 'Diligent', 'Sincere'],
  },
];

/**
 * Trine Groups - Signs within the same trine share similar traits
 * and are considered highly compatible
 */
export const TRINE_GROUPS: Record<TrineGroup, { signs: string[]; characteristics: string }> = {
  1: {
    signs: ['Rat', 'Dragon', 'Monkey'],
    characteristics: 'Action-oriented, intelligent, ambitious. Natural leaders who thrive on competition.',
  },
  2: {
    signs: ['Ox', 'Snake', 'Rooster'],
    characteristics: 'Steadfast, goal-oriented, methodical. Deep thinkers who achieve through persistence.',
  },
  3: {
    signs: ['Tiger', 'Horse', 'Dog'],
    characteristics: 'Free spirits, humanitarian, idealistic. Independent souls who fight for causes.',
  },
  4: {
    signs: ['Rabbit', 'Goat', 'Pig'],
    characteristics: 'Peaceful, artistic, compassionate. Creative minds who seek harmony.',
  },
};

/**
 * The 10 Heavenly Stems (Tian Gan) - Used in the Sexagenary cycle
 */
export const HEAVENLY_STEMS = [
  { name: 'Jia', character: '甲', element: 'Wood' as ElementType, polarity: 'Yang' as Polarity },
  { name: 'Yi', character: '乙', element: 'Wood' as ElementType, polarity: 'Yin' as Polarity },
  { name: 'Bing', character: '丙', element: 'Fire' as ElementType, polarity: 'Yang' as Polarity },
  { name: 'Ding', character: '丁', element: 'Fire' as ElementType, polarity: 'Yin' as Polarity },
  { name: 'Wu', character: '戊', element: 'Earth' as ElementType, polarity: 'Yang' as Polarity },
  { name: 'Ji', character: '己', element: 'Earth' as ElementType, polarity: 'Yin' as Polarity },
  { name: 'Geng', character: '庚', element: 'Metal' as ElementType, polarity: 'Yang' as Polarity },
  { name: 'Xin', character: '辛', element: 'Metal' as ElementType, polarity: 'Yin' as Polarity },
  { name: 'Ren', character: '壬', element: 'Water' as ElementType, polarity: 'Yang' as Polarity },
  { name: 'Gui', character: '癸', element: 'Water' as ElementType, polarity: 'Yin' as Polarity },
];

/**
 * The complete 60-year Sexagenary Cycle (Jiazi)
 * Each year is a unique combination of Heavenly Stem + Earthly Branch
 * Reference: Year 1 (Jiazi) = 1984
 */
export interface SexagenaryCycleYear {
  cycleNumber: number; // 1-60
  stem: typeof HEAVENLY_STEMS[number];
  branch: ZodiacAnimal;
  name: string; // Combined name (e.g., "Jia Zi")
  character: string; // Combined characters (e.g., "甲子")
  element: ElementType; // Element from the Heavenly Stem
  recentYears: number[]; // Recent Gregorian years for this combination
}

/**
 * Generate the 60-year Sexagenary cycle
 */
export function generateSexagenaryCycle(): SexagenaryCycleYear[] {
  const cycle: SexagenaryCycleYear[] = [];
  const baseYear = 1984; // Jiazi year

  for (let i = 0; i < 60; i++) {
    const stemIndex = i % 10;
    const branchIndex = i % 12;
    const stem = HEAVENLY_STEMS[stemIndex];
    const branch = ZODIAC_ANIMALS[branchIndex];

    // Calculate recent years (past 120 years and next 60 years)
    const recentYears: number[] = [];
    for (let offset = -2; offset <= 1; offset++) {
      recentYears.push(baseYear + i + offset * 60);
    }

    cycle.push({
      cycleNumber: i + 1,
      stem,
      branch,
      name: `${stem.name} ${branch.earthlyBranchPinyin}`,
      character: `${stem.character}${branch.earthlyBranch}`,
      element: stem.element,
      recentYears: recentYears.filter((y) => y >= 1900 && y <= 2100),
    });
  }

  return cycle;
}

/**
 * Pre-generated Sexagenary cycle for quick lookups
 */
export const SEXAGENARY_CYCLE = generateSexagenaryCycle();

/**
 * Notable years in the Sexagenary cycle
 * These years have special significance in Chinese astrology
 */
export const NOTABLE_YEARS = {
  fireHorse: {
    name: 'Fire Horse',
    character: '丙午',
    significance:
      'The Fire Horse (Bing Wu) year is considered particularly intense. ' +
      'Fire element combined with the already fiery Horse creates a double-fire influence. ' +
      'Historically associated with strong personalities and significant events.',
    recentYears: [1906, 1966, 2026],
    cycleNumber: 43,
  },
  woodDragon: {
    name: 'Wood Dragon',
    character: '甲辰',
    significance:
      'Wood Dragon years are considered highly auspicious for new beginnings. ' +
      'Wood nourishes growth while Dragon brings power and transformation.',
    recentYears: [1904, 1964, 2024],
    cycleNumber: 41,
  },
  goldenRat: {
    name: 'Metal Rat',
    character: '庚子',
    significance:
      'The Metal Rat (Geng Zi) year marks the beginning of a new 60-year cycle. ' +
      'Associated with new starts and fresh energy.',
    recentYears: [1900, 1960, 2020],
    cycleNumber: 37,
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get zodiac animal by name
 */
export function getZodiacByName(name: string): ZodiacAnimal | undefined {
  return ZODIAC_ANIMALS.find((z) => z.name.toLowerCase() === name.toLowerCase());
}

/**
 * Get zodiac animal for a specific year (simplified - use TimeDecoder for precision)
 */
export function getZodiacForYear(year: number): ZodiacAnimal {
  const offset = ((year - 1900) % 12 + 12) % 12;
  return ZODIAC_ANIMALS[offset];
}

/**
 * Get the Sexagenary cycle year info for a given Gregorian year
 */
export function getSexagenaryCycleYear(year: number): SexagenaryCycleYear {
  const offset = ((year - 1984) % 60 + 60) % 60;
  return SEXAGENARY_CYCLE[offset];
}

/**
 * Get zodiac animals in the same trine group
 */
export function getTrineCompanions(zodiacName: string): string[] {
  const zodiac = getZodiacByName(zodiacName);
  if (!zodiac) return [];

  const trineInfo = TRINE_GROUPS[zodiac.trineGroup];
  return trineInfo.signs.filter((s) => s !== zodiacName);
}

/**
 * Get the current zodiac hour (Shichen)
 */
export function getCurrentZodiacHour(date: Date = new Date()): ZodiacAnimal {
  const hour = date.getHours();

  // Special case: 23:00-01:00 is Rat hour (spans midnight)
  if (hour >= 23 || hour < 1) return ZODIAC_ANIMALS[0]; // Rat

  // Find the matching hour
  for (const zodiac of ZODIAC_ANIMALS) {
    if (hour >= zodiac.hourStart && hour < zodiac.hourEnd) {
      return zodiac;
    }
  }

  // Fallback (shouldn't reach here)
  return ZODIAC_ANIMALS[0];
}

/**
 * Calculate basic compatibility between two zodiac signs
 * Returns a score from 0-100
 */
export function calculateCompatibility(sign1: string, sign2: string): {
  score: number;
  relationship: string;
  description: string;
} {
  const z1 = getZodiacByName(sign1);
  const z2 = getZodiacByName(sign2);

  if (!z1 || !z2) {
    return { score: 0, relationship: 'Unknown', description: 'Invalid zodiac sign(s)' };
  }

  // Same sign
  if (z1.name === z2.name) {
    return {
      score: 70,
      relationship: 'Same Sign',
      description: `Two ${z1.name}s understand each other deeply but may amplify shared weaknesses.`,
    };
  }

  // Secret friends (highly compatible)
  if (z1.secretFriend === z2.name) {
    return {
      score: 95,
      relationship: 'Secret Friends',
      description: `${z1.name} and ${z2.name} share a special bond as secret friends.`,
    };
  }

  // Same trine (very compatible)
  if (z1.trineGroup === z2.trineGroup) {
    return {
      score: 85,
      relationship: 'Trine Companions',
      description: `${z1.name} and ${z2.name} belong to the same trine, sharing similar values and goals.`,
    };
  }

  // Conflict signs (challenging)
  if (z1.conflictSign === z2.name) {
    return {
      score: 30,
      relationship: 'Opposing Signs',
      description: `${z1.name} and ${z2.name} are in opposition, which can create tension but also growth.`,
    };
  }

  // Default: moderate compatibility
  return {
    score: 60,
    relationship: 'Neutral',
    description: `${z1.name} and ${z2.name} have a neutral relationship with potential for harmony.`,
  };
}
