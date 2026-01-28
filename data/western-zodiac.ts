/**
 * Western (Tropical) Zodiac Data
 *
 * Complete dataset for the 12 Western astrological signs including:
 * - Date ranges (tropical/sun-sign boundaries)
 * - Classical elements (Fire, Earth, Air, Water)
 * - Modalities (Cardinal, Fixed, Mutable)
 * - Ruling planets
 * - Compatibility groupings
 * - Symbol and glyph info
 */

export type WesternElement = 'Fire' | 'Earth' | 'Air' | 'Water';
export type Modality = 'Cardinal' | 'Fixed' | 'Mutable';

export interface WesternZodiacSign {
  name: string;
  symbol: string;
  emoji: string;
  element: WesternElement;
  modality: Modality;
  rulingPlanet: string;
  // Date boundaries (month, day) - inclusive start, exclusive end
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
  traits: string[];
  // Compatible signs by element (same element + complementary)
  compatibleSigns: string[];
  oppositeSign: string;
}

export const WESTERN_ZODIAC_SIGNS: WesternZodiacSign[] = [
  {
    name: 'Aries',
    symbol: '♈',
    emoji: '♈',
    element: 'Fire',
    modality: 'Cardinal',
    rulingPlanet: 'Mars',
    startMonth: 3,
    startDay: 21,
    endMonth: 4,
    endDay: 19,
    traits: ['Bold', 'Ambitious', 'Energetic', 'Pioneering'],
    compatibleSigns: ['Leo', 'Sagittarius', 'Gemini', 'Aquarius'],
    oppositeSign: 'Libra',
  },
  {
    name: 'Taurus',
    symbol: '♉',
    emoji: '♉',
    element: 'Earth',
    modality: 'Fixed',
    rulingPlanet: 'Venus',
    startMonth: 4,
    startDay: 20,
    endMonth: 5,
    endDay: 20,
    traits: ['Reliable', 'Patient', 'Devoted', 'Grounded'],
    compatibleSigns: ['Virgo', 'Capricorn', 'Cancer', 'Pisces'],
    oppositeSign: 'Scorpio',
  },
  {
    name: 'Gemini',
    symbol: '♊',
    emoji: '♊',
    element: 'Air',
    modality: 'Mutable',
    rulingPlanet: 'Mercury',
    startMonth: 5,
    startDay: 21,
    endMonth: 6,
    endDay: 20,
    traits: ['Curious', 'Adaptable', 'Communicative', 'Witty'],
    compatibleSigns: ['Libra', 'Aquarius', 'Aries', 'Leo'],
    oppositeSign: 'Sagittarius',
  },
  {
    name: 'Cancer',
    symbol: '♋',
    emoji: '♋',
    element: 'Water',
    modality: 'Cardinal',
    rulingPlanet: 'Moon',
    startMonth: 6,
    startDay: 21,
    endMonth: 7,
    endDay: 22,
    traits: ['Intuitive', 'Nurturing', 'Protective', 'Sentimental'],
    compatibleSigns: ['Scorpio', 'Pisces', 'Taurus', 'Virgo'],
    oppositeSign: 'Capricorn',
  },
  {
    name: 'Leo',
    symbol: '♌',
    emoji: '♌',
    element: 'Fire',
    modality: 'Fixed',
    rulingPlanet: 'Sun',
    startMonth: 7,
    startDay: 23,
    endMonth: 8,
    endDay: 22,
    traits: ['Confident', 'Dramatic', 'Generous', 'Creative'],
    compatibleSigns: ['Aries', 'Sagittarius', 'Gemini', 'Libra'],
    oppositeSign: 'Aquarius',
  },
  {
    name: 'Virgo',
    symbol: '♍',
    emoji: '♍',
    element: 'Earth',
    modality: 'Mutable',
    rulingPlanet: 'Mercury',
    startMonth: 8,
    startDay: 23,
    endMonth: 9,
    endDay: 22,
    traits: ['Analytical', 'Practical', 'Diligent', 'Modest'],
    compatibleSigns: ['Taurus', 'Capricorn', 'Cancer', 'Scorpio'],
    oppositeSign: 'Pisces',
  },
  {
    name: 'Libra',
    symbol: '♎',
    emoji: '♎',
    element: 'Air',
    modality: 'Cardinal',
    rulingPlanet: 'Venus',
    startMonth: 9,
    startDay: 23,
    endMonth: 10,
    endDay: 22,
    traits: ['Diplomatic', 'Fair', 'Social', 'Harmonious'],
    compatibleSigns: ['Gemini', 'Aquarius', 'Leo', 'Sagittarius'],
    oppositeSign: 'Aries',
  },
  {
    name: 'Scorpio',
    symbol: '♏',
    emoji: '♏',
    element: 'Water',
    modality: 'Fixed',
    rulingPlanet: 'Pluto',
    startMonth: 10,
    startDay: 23,
    endMonth: 11,
    endDay: 21,
    traits: ['Passionate', 'Resourceful', 'Determined', 'Magnetic'],
    compatibleSigns: ['Cancer', 'Pisces', 'Virgo', 'Capricorn'],
    oppositeSign: 'Taurus',
  },
  {
    name: 'Sagittarius',
    symbol: '♐',
    emoji: '♐',
    element: 'Fire',
    modality: 'Mutable',
    rulingPlanet: 'Jupiter',
    startMonth: 11,
    startDay: 22,
    endMonth: 12,
    endDay: 21,
    traits: ['Adventurous', 'Optimistic', 'Philosophical', 'Free-spirited'],
    compatibleSigns: ['Aries', 'Leo', 'Libra', 'Aquarius'],
    oppositeSign: 'Gemini',
  },
  {
    name: 'Capricorn',
    symbol: '♑',
    emoji: '♑',
    element: 'Earth',
    modality: 'Cardinal',
    rulingPlanet: 'Saturn',
    startMonth: 12,
    startDay: 22,
    endMonth: 1,
    endDay: 19,
    traits: ['Disciplined', 'Ambitious', 'Responsible', 'Strategic'],
    compatibleSigns: ['Taurus', 'Virgo', 'Scorpio', 'Pisces'],
    oppositeSign: 'Cancer',
  },
  {
    name: 'Aquarius',
    symbol: '♒',
    emoji: '♒',
    element: 'Air',
    modality: 'Fixed',
    rulingPlanet: 'Uranus',
    startMonth: 1,
    startDay: 20,
    endMonth: 2,
    endDay: 18,
    traits: ['Innovative', 'Independent', 'Humanitarian', 'Progressive'],
    compatibleSigns: ['Gemini', 'Libra', 'Aries', 'Sagittarius'],
    oppositeSign: 'Leo',
  },
  {
    name: 'Pisces',
    symbol: '♓',
    emoji: '♓',
    element: 'Water',
    modality: 'Mutable',
    rulingPlanet: 'Neptune',
    startMonth: 2,
    startDay: 19,
    endMonth: 3,
    endDay: 20,
    traits: ['Empathetic', 'Imaginative', 'Intuitive', 'Artistic'],
    compatibleSigns: ['Cancer', 'Scorpio', 'Taurus', 'Capricorn'],
    oppositeSign: 'Virgo',
  },
];

/**
 * Get Western zodiac sign from a date of birth
 */
export function getWesternZodiac(month: number, day: number): WesternZodiacSign {
  for (const sign of WESTERN_ZODIAC_SIGNS) {
    if (sign.startMonth === sign.endMonth) {
      // Same month range (shouldn't happen with standard zodiac)
      if (month === sign.startMonth && day >= sign.startDay && day <= sign.endDay) {
        return sign;
      }
    } else if (sign.endMonth < sign.startMonth) {
      // Wraps around year end (Capricorn: Dec 22 - Jan 19)
      if (
        (month === sign.startMonth && day >= sign.startDay) ||
        (month === sign.endMonth && day <= sign.endDay)
      ) {
        return sign;
      }
    } else {
      // Normal range within same year
      if (
        (month === sign.startMonth && day >= sign.startDay) ||
        (month === sign.endMonth && day <= sign.endDay) ||
        (month > sign.startMonth && month < sign.endMonth)
      ) {
        return sign;
      }
    }
  }

  // Fallback (shouldn't reach here with valid dates)
  return WESTERN_ZODIAC_SIGNS[0];
}

/**
 * Get Western zodiac sign from a Date object
 */
export function getWesternZodiacFromDate(date: Date): WesternZodiacSign {
  return getWesternZodiac(date.getMonth() + 1, date.getDate());
}

/**
 * Get Western zodiac sign by name
 */
export function getWesternZodiacByName(name: string): WesternZodiacSign | undefined {
  return WESTERN_ZODIAC_SIGNS.find(
    (s) => s.name.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Get the date range string for a Western zodiac sign
 */
export function getWesternZodiacDateRange(sign: WesternZodiacSign): string {
  const months = [
    '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${months[sign.startMonth]} ${sign.startDay} - ${months[sign.endMonth]} ${sign.endDay}`;
}

/**
 * Calculate Western zodiac compatibility between two signs
 */
export function calculateWesternCompatibility(
  sign1: string,
  sign2: string
): { score: number; relationship: string; description: string } {
  const s1 = getWesternZodiacByName(sign1);
  const s2 = getWesternZodiacByName(sign2);

  if (!s1 || !s2) {
    return { score: 0, relationship: 'Unknown', description: 'Invalid sign(s)' };
  }

  if (s1.name === s2.name) {
    return {
      score: 75,
      relationship: 'Same Sign',
      description: `Two ${s1.name}s share deep understanding but may amplify each other's tendencies.`,
    };
  }

  if (s1.compatibleSigns.includes(s2.name)) {
    const sameElement = s1.element === s2.element;
    return {
      score: sameElement ? 90 : 80,
      relationship: sameElement ? 'Element Match' : 'Complementary',
      description: sameElement
        ? `${s1.name} and ${s2.name} share the ${s1.element} element, creating natural harmony.`
        : `${s1.name} and ${s2.name} complement each other's strengths.`,
    };
  }

  if (s1.oppositeSign === s2.name) {
    return {
      score: 55,
      relationship: 'Opposite Signs',
      description: `${s1.name} and ${s2.name} are opposites - magnetic attraction with potential tension.`,
    };
  }

  // Square aspect (same modality, different element)
  if (s1.modality === s2.modality && s1.element !== s2.element) {
    return {
      score: 45,
      relationship: 'Square Aspect',
      description: `${s1.name} and ${s2.name} share ${s1.modality} energy, creating dynamic friction.`,
    };
  }

  return {
    score: 60,
    relationship: 'Neutral',
    description: `${s1.name} and ${s2.name} have a neutral relationship with room to grow.`,
  };
}

/**
 * Western element colors
 */
export function getWesternElementColor(element: WesternElement): string {
  const colors: Record<WesternElement, string> = {
    Fire: 'text-red-400',
    Earth: 'text-amber-400',
    Air: 'text-sky-400',
    Water: 'text-blue-400',
  };
  return colors[element] || 'text-gray-400';
}

export function getWesternElementBg(element: WesternElement): string {
  const colors: Record<WesternElement, string> = {
    Fire: 'bg-red-950/40',
    Earth: 'bg-amber-950/40',
    Air: 'bg-sky-950/40',
    Water: 'bg-blue-950/40',
  };
  return colors[element] || 'bg-gray-950/40';
}
