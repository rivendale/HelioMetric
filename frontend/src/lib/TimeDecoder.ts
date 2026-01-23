/**
 * TimeDecoder: The Master Clock for Evergreen Temporal Analysis
 *
 * Implements astronomically-accurate solar position calculations using
 * the astronomy-engine library. Critically, this module correctly implements
 * the Li Chun Rule: The Chinese Energetic Year begins when the Sun
 * reaches 315 celestial longitude (~Feb 4th), NOT on January 1st.
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
  yearArchetype: ZodiacArchetype;
  yearElement: ElementType;
  energeticYear: number;
  solarLongitude: number;
  solarLongitudeFormatted: string;
  currentSolarTerm: SolarTerm;
  nextSolarTerm: SolarTerm;
  progressInTerm: number;
  isRetrograde: boolean;
  utcTimestamp: string;
  dayOfEnergeticYear: number;
}

export class TimeDecoder {
  getTemporalState(date: Date): TemporalState {
    const astroDate = Astronomy.MakeTime(date);
    const sunPosition = Astronomy.SunPosition(astroDate);
    const solarLongitude = sunPosition.elon;

    const { energeticYear, dayOfEnergeticYear } = this.calculateEnergeticYear(date);
    const yearArchetype = this.getZodiacFromYear(energeticYear);
    const yearElement = this.getElementFromYear(energeticYear);
    const { currentTerm, nextTerm, progress } = this.getSolarTermInfo(solarLongitude);
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
      isRetrograde: false,
      utcTimestamp,
      dayOfEnergeticYear,
    };
  }

  private calculateEnergeticYear(date: Date): {
    energeticYear: number;
    dayOfEnergeticYear: number;
  } {
    const calendarYear = date.getFullYear();
    const liChunDate = this.findLiChunDate(calendarYear);

    let energeticYear: number;
    let liChunStart: Date;

    if (date < liChunDate) {
      energeticYear = calendarYear - 1;
      liChunStart = this.findLiChunDate(calendarYear - 1);
    } else {
      energeticYear = calendarYear;
      liChunStart = liChunDate;
    }

    const msPerDay = 24 * 60 * 60 * 1000;
    const dayOfEnergeticYear = Math.floor((date.getTime() - liChunStart.getTime()) / msPerDay) + 1;

    return { energeticYear, dayOfEnergeticYear };
  }

  private findLiChunDate(year: number): Date {
    const startSearch = new Date(year, 1, 1);
    const endSearch = new Date(year, 1, 10);

    let low = startSearch.getTime();
    let high = endSearch.getTime();

    while (high - low > 60000) {
      const mid = (low + high) / 2;
      const midDate = new Date(mid);
      const astroDate = Astronomy.MakeTime(midDate);
      const sunPos = Astronomy.SunPosition(astroDate);

      if (sunPos.elon < 315 && sunPos.elon > 180) {
        low = mid;
      } else if (sunPos.elon >= 315) {
        high = mid;
      } else {
        high = mid;
      }
    }

    return new Date(high);
  }

  private getZodiacFromYear(year: number): ZodiacArchetype {
    const offset = ((year - 1900) % 12 + 12) % 12;
    return ZODIAC_SEQUENCE[offset];
  }

  private getElementFromYear(year: number): ElementType {
    const offset = ((year - 1900) % 10 + 10) % 10;
    return ELEMENT_SEQUENCE[offset] as ElementType;
  }

  private getSolarTermInfo(solarLongitude: number): {
    currentTerm: SolarTerm;
    nextTerm: SolarTerm;
    progress: number;
  } {
    let currentIndex = -1;

    for (let i = 0; i < SOLAR_TERMS.length; i++) {
      const term = SOLAR_TERMS[i];
      const nextTerm = SOLAR_TERMS[(i + 1) % SOLAR_TERMS.length];

      const termEnd = nextTerm.longitude;
      const termStart = term.longitude;

      if (termEnd < termStart) {
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

    if (currentIndex === -1) currentIndex = 0;

    const currentTerm = SOLAR_TERMS[currentIndex];
    const nextTerm = SOLAR_TERMS[(currentIndex + 1) % SOLAR_TERMS.length];

    let termStart = currentTerm.longitude;
    let termEnd = nextTerm.longitude;

    if (termEnd < termStart) {
      if (solarLongitude >= termStart) {
        termEnd = termEnd + 360;
      } else {
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

    return {
      archetype: this.getZodiacFromYear(birthYear),
      element: this.getElementFromYear(birthYear),
      energeticYear: birthYear,
    };
  }

  getEnvironmentalVector(date: Date): {
    archetype: ZodiacArchetype;
    element: ElementType;
    phase: number;
    intensity: number;
  } {
    const state = this.getTemporalState(date);
    const zodiacIndex = ZODIAC_SEQUENCE.indexOf(state.yearArchetype);
    const phase = zodiacIndex * 30;
    const intensity = Math.sin((state.dayOfEnergeticYear / 365) * Math.PI);

    return {
      archetype: state.yearArchetype,
      element: state.yearElement,
      phase,
      intensity: Math.max(0.1, intensity),
    };
  }
}

export const timeDecoder = new TimeDecoder();

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
