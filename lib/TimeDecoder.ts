/**
 * TimeDecoder: The Master Clock for Evergreen Temporal Analysis
 *
 * Implements astronomically-accurate solar position calculations using
 * the astronomy-engine library. Critically, this module correctly implements
 * the Li Chun (立春) Rule: The Chinese Energetic Year begins when the Sun
 * reaches 315° celestial longitude (~Feb 4th), NOT on January 1st.
 *
 * Scientific Framework:
 * - Celestial Longitude: Sun's position along the ecliptic (0-360°)
 * - Li Chun (Start of Spring): 315° - marks the beginning of the Energetic Year
 * - Solar Terms: 24 divisions of the solar year, each 15° of longitude
 */

import * as Astronomy from 'astronomy-engine';
import { DateTime } from 'luxon';

// Zodiac archetypes in sequence (starting from Rat at index 0)
const ZODIAC_SEQUENCE = [
  'Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake',
  'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'
] as const;

// Element cycle (repeats every 2 years within 10-year stem cycle)
const ELEMENT_SEQUENCE = ['Wood', 'Wood', 'Fire', 'Fire', 'Earth', 'Earth',
                          'Metal', 'Metal', 'Water', 'Water'] as const;

// Solar term definitions (name, start longitude)
const SOLAR_TERMS = [
  { name: 'Li Chun', longitude: 315, meaning: 'Start of Spring' },
  { name: 'Yu Shui', longitude: 330, meaning: 'Rain Water' },
  { name: 'Jing Zhe', longitude: 345, meaning: 'Awakening of Insects' },
  { name: 'Chun Fen', longitude: 0, meaning: 'Spring Equinox' },
  { name: 'Qing Ming', longitude: 15, meaning: 'Clear and Bright' },
  { name: 'Gu Yu', longitude: 30, meaning: 'Grain Rain' },
  { name: 'Li Xia', longitude: 45, meaning: 'Start of Summer' },
  { name: 'Xiao Man', longitude: 60, meaning: 'Grain Buds' },
  { name: 'Mang Zhong', longitude: 75, meaning: 'Grain in Ear' },
  { name: 'Xia Zhi', longitude: 90, meaning: 'Summer Solstice' },
  { name: 'Xiao Shu', longitude: 105, meaning: 'Minor Heat' },
  { name: 'Da Shu', longitude: 120, meaning: 'Major Heat' },
  { name: 'Li Qiu', longitude: 135, meaning: 'Start of Autumn' },
  { name: 'Chu Shu', longitude: 150, meaning: 'End of Heat' },
  { name: 'Bai Lu', longitude: 165, meaning: 'White Dew' },
  { name: 'Qiu Fen', longitude: 180, meaning: 'Autumn Equinox' },
  { name: 'Han Lu', longitude: 195, meaning: 'Cold Dew' },
  { name: 'Shuang Jiang', longitude: 210, meaning: 'Frost Descent' },
  { name: 'Li Dong', longitude: 225, meaning: 'Start of Winter' },
  { name: 'Xiao Xue', longitude: 240, meaning: 'Minor Snow' },
  { name: 'Da Xue', longitude: 255, meaning: 'Major Snow' },
  { name: 'Dong Zhi', longitude: 270, meaning: 'Winter Solstice' },
  { name: 'Xiao Han', longitude: 285, meaning: 'Minor Cold' },
  { name: 'Da Han', longitude: 300, meaning: 'Major Cold' },
] as const;

export type ZodiacArchetype = typeof ZODIAC_SEQUENCE[number];
export type ElementType = 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water';

export interface SolarTerm {
  name: string;
  longitude: number;
  meaning: string;
}

export interface TemporalState {
  // Core temporal vector
  yearArchetype: ZodiacArchetype;
  yearElement: ElementType;
  energeticYear: number; // The "true" year based on Li Chun

  // Solar position data
  solarLongitude: number; // 0-360 degrees
  solarLongitudeFormatted: string;

  // Solar term analysis
  currentSolarTerm: SolarTerm;
  nextSolarTerm: SolarTerm;
  progressInTerm: number; // 0-1, how far through current term

  // Retrograde status (placeholder for future planetary calculations)
  isRetrograde: boolean;

  // UTC timestamp for precision
  utcTimestamp: string;

  // Day of energetic year (1-365/366)
  dayOfEnergeticYear: number;
}

/**
 * TimeDecoder: Master temporal analysis engine
 *
 * Provides astronomically-accurate calculations for Chinese metaphysical
 * time cycles. All calculations are performed in UTC for consistency.
 */
export class TimeDecoder {
  /**
   * Calculate the complete temporal state for a given date
   * This is the primary entry point for all temporal analysis
   */
  getTemporalState(date: Date): TemporalState {
    // Convert to Astronomy.Date for calculations
    const astroDate = Astronomy.MakeTime(date);

    // Calculate solar longitude (ecliptic longitude of the Sun)
    const sunPosition = Astronomy.SunPosition(astroDate);
    const solarLongitude = sunPosition.elon; // 0-360 degrees

    // Determine the energetic year using Li Chun Rule
    const { energeticYear, dayOfEnergeticYear } = this.calculateEnergeticYear(date);

    // Calculate zodiac archetype from energetic year
    const yearArchetype = this.getZodiacFromYear(energeticYear);
    const yearElement = this.getElementFromYear(energeticYear);

    // Determine current and next solar terms
    const { currentTerm, nextTerm, progress } = this.getSolarTermInfo(solarLongitude);

    // Format UTC timestamp using Luxon
    const utcTimestamp = DateTime.fromJSDate(date).toUTC().toISO() || date.toISOString();

    return {
      yearArchetype,
      yearElement,
      energeticYear,
      solarLongitude,
      solarLongitudeFormatted: `${solarLongitude.toFixed(2)}°`,
      currentSolarTerm: currentTerm,
      nextSolarTerm: nextTerm,
      progressInTerm: progress,
      isRetrograde: false, // Placeholder - Sun doesn't retrograde
      utcTimestamp,
      dayOfEnergeticYear,
    };
  }

  /**
   * The Li Chun Rule: Determine the "Energetic Year"
   *
   * CRITICAL: The Chinese zodiac year does NOT change on January 1st.
   * It changes when the Sun reaches 315° celestial longitude (Li Chun),
   * which typically falls around February 4th.
   *
   * Example: January 15, 2026 is still in the Year of the Snake (2025),
   * not the Year of the Horse (2026), because Li Chun hasn't occurred yet.
   */
  private calculateEnergeticYear(date: Date): {
    energeticYear: number;
    dayOfEnergeticYear: number;
  } {
    const calendarYear = date.getFullYear();

    // Find the exact Li Chun date for the current calendar year
    // Li Chun occurs when Sun reaches 315° celestial longitude (~Feb 4th)
    const liChunDate = this.findLiChunDate(calendarYear);

    let energeticYear: number;
    let liChunStart: Date;

    if (date < liChunDate) {
      // Before this year's Li Chun, so we're still in the previous energetic year
      energeticYear = calendarYear - 1;
      liChunStart = this.findLiChunDate(calendarYear - 1);
    } else {
      // At or after Li Chun, we're in the current energetic year
      energeticYear = calendarYear;
      liChunStart = liChunDate;
    }

    // Calculate day of energetic year
    const msPerDay = 24 * 60 * 60 * 1000;
    const dayOfEnergeticYear = Math.floor((date.getTime() - liChunStart.getTime()) / msPerDay) + 1;

    return { energeticYear, dayOfEnergeticYear };
  }

  /**
   * Find the exact date of Li Chun (315° solar longitude) for a given year
   */
  private findLiChunDate(year: number): Date {
    // Li Chun typically occurs around February 3-5
    // Use astronomy-engine to find exact moment
    const startSearch = new Date(year, 1, 1); // Feb 1
    const endSearch = new Date(year, 1, 10); // Feb 10

    // Binary search for when solar longitude crosses 315°
    let low = startSearch.getTime();
    let high = endSearch.getTime();

    while (high - low > 60000) { // Precision to within 1 minute
      const mid = (low + high) / 2;
      const midDate = new Date(mid);
      const astroDate = Astronomy.MakeTime(midDate);
      const sunPos = Astronomy.SunPosition(astroDate);

      // Solar longitude at 315° marks Li Chun
      // Handle wrap-around: 315° is just before 360°/0°
      if (sunPos.elon < 315 && sunPos.elon > 180) {
        // We're before Li Chun (in the 180-315 range)
        low = mid;
      } else if (sunPos.elon >= 315) {
        // We're at or past Li Chun
        high = mid;
      } else {
        // We're in 0-180 range, way past Li Chun
        high = mid;
      }
    }

    return new Date(high);
  }

  /**
   * Get zodiac animal from year using the traditional cycle
   * Reference: 1900 was Year of the Rat
   */
  private getZodiacFromYear(year: number): ZodiacArchetype {
    const offset = ((year - 1900) % 12 + 12) % 12; // Handle negative years
    return ZODIAC_SEQUENCE[offset];
  }

  /**
   * Get element from year using the Heavenly Stems cycle
   * Reference: Uses traditional 10-year element cycle
   */
  private getElementFromYear(year: number): ElementType {
    const offset = ((year - 1900) % 10 + 10) % 10; // Handle negative years
    return ELEMENT_SEQUENCE[offset] as ElementType;
  }

  /**
   * Determine current solar term and progress through it
   */
  private getSolarTermInfo(solarLongitude: number): {
    currentTerm: SolarTerm;
    nextTerm: SolarTerm;
    progress: number;
  } {
    // Find which solar term we're in
    let currentIndex = -1;

    for (let i = 0; i < SOLAR_TERMS.length; i++) {
      const term = SOLAR_TERMS[i];
      const nextTerm = SOLAR_TERMS[(i + 1) % SOLAR_TERMS.length];

      const termEnd = nextTerm.longitude;
      const termStart = term.longitude;

      // Handle wrap-around at 360°/0°
      if (termEnd < termStart) {
        // This term spans the 0° boundary
        if (solarLongitude >= termStart || solarLongitude < termEnd) {
          currentIndex = i;
          break;
        }
      } else {
        if (solarLongitude >= termStart && solarLongitude < termEnd) {
          currentIndex = i;
          break;
        }
      }
    }

    // Fallback if not found (shouldn't happen)
    if (currentIndex === -1) currentIndex = 0;

    const currentTerm = SOLAR_TERMS[currentIndex];
    const nextTerm = SOLAR_TERMS[(currentIndex + 1) % SOLAR_TERMS.length];

    // Calculate progress through current term
    let termStart = currentTerm.longitude;
    let termEnd = nextTerm.longitude;

    // Handle wrap-around
    if (termEnd < termStart) {
      if (solarLongitude >= termStart) {
        // We're in the portion before 360°
        termEnd = termEnd + 360;
      } else {
        // We're in the portion after 0°
        termStart = termStart - 360;
      }
    }

    const termRange = termEnd - termStart;
    const progress = (solarLongitude - termStart) / termRange;

    return {
      currentTerm: { ...currentTerm },
      nextTerm: { ...nextTerm },
      progress: Math.max(0, Math.min(1, progress)),
    };
  }

  /**
   * Get the zodiac sign for a specific birth year, accounting for Li Chun
   * If birthDate is provided with month/day, uses precise Li Chun calculation
   */
  getZodiacForBirthYear(birthYear: number, birthDate?: Date): {
    archetype: ZodiacArchetype;
    element: ElementType;
    energeticYear: number;
  } {
    if (birthDate) {
      const state = this.getTemporalState(birthDate);
      return {
        archetype: state.yearArchetype,
        element: state.yearElement,
        energeticYear: state.energeticYear,
      };
    }

    // Without a full date, assume the person was born after Li Chun
    return {
      archetype: this.getZodiacFromYear(birthYear),
      element: this.getElementFromYear(birthYear),
      energeticYear: birthYear,
    };
  }

  /**
   * Calculate the "Environmental Vector" - the current year's characteristics
   * that create the interference pattern with individual birth charts
   */
  getEnvironmentalVector(date: Date): {
    archetype: ZodiacArchetype;
    element: ElementType;
    phase: number;
    intensity: number;
  } {
    const state = this.getTemporalState(date);

    // Phase based on zodiac position (0-360°)
    const zodiacIndex = ZODIAC_SEQUENCE.indexOf(state.yearArchetype);
    const phase = zodiacIndex * 30; // Each sign spans 30°

    // Intensity based on progress through the year
    // Peaks at mid-year (around Summer Solstice)
    const intensity = Math.sin((state.dayOfEnergeticYear / 365) * Math.PI);

    return {
      archetype: state.yearArchetype,
      element: state.yearElement,
      phase,
      intensity: Math.max(0.1, intensity),
    };
  }
}

// Singleton instance for convenience
export const timeDecoder = new TimeDecoder();

// Utility function for quick zodiac lookup
export function getAccurateZodiac(date: Date): {
  archetype: ZodiacArchetype;
  element: ElementType;
} {
  const state = timeDecoder.getTemporalState(date);
  return {
    archetype: state.yearArchetype,
    element: state.yearElement,
  };
}
