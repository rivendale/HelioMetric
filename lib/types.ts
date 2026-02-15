/**
 * Shared Type Definitions for HelioMetric
 *
 * Central location for TypeScript interfaces and types used across
 * the frontend application. All API response types support both
 * snake_case and camelCase field names.
 */

// ============================================================================
// Element Types (Wu Xing / Five Elements)
// ============================================================================

export type ElementType = 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water';

export type Polarity = 'Yang' | 'Yin';

// ============================================================================
// Zodiac Types
// ============================================================================

export type ZodiacArchetype =
  | 'Rat'
  | 'Ox'
  | 'Tiger'
  | 'Rabbit'
  | 'Dragon'
  | 'Snake'
  | 'Horse'
  | 'Goat'
  | 'Monkey'
  | 'Rooster'
  | 'Dog'
  | 'Pig';

export interface ZodiacSign {
  name: string;
  element: ElementType;
  phase: number; // 0-360 degrees
}

// ============================================================================
// NOAA Space Weather Types
// ============================================================================

/**
 * Canonical types use camelCase internally.
 * API responses may include snake_case aliases — use `normalizeApiResponse()`
 * from api-utils.ts to normalize incoming data to these canonical forms.
 */

export interface KIndexReading {
  timeTag: string;
  kpIndex: number;
  observedTime: string;
}

export interface NOAASpaceWeatherData {
  latest: KIndexReading;
  readings: KIndexReading[];
  averageKp: number;
  maxKp: number;
  isSimulated?: boolean;
  status: 'quiet' | 'unsettled' | 'storm';
  description?: string;
  color?: string;
}

// ============================================================================
// Location Analysis Types
// ============================================================================

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GeomagneticInfo {
  latitude: number;
  declination: number;
}

export interface StormImpactInfo {
  factor: number;
  description: string;
  auroraLikelihood: string;
}

export interface TimezoneInfo {
  id: string;
  name: string;
  utcOffset: number;
}

export interface LocationAnalysis {
  coordinates: Coordinates;
  geomagnetic: GeomagneticInfo;
  stormImpact: StormImpactInfo;
  timezone?: TimezoneInfo;
}

// ============================================================================
// Geocoding Types
// ============================================================================

export interface GeoLocation {
  lat: number;
  lng: number;
  formattedAddress: string;
  placeId: string;
  magneticDeclination?: number;
  timezone?: string;
}

export interface GeocodeResponse {
  location: GeoLocation | null;
  cached: boolean;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface APIError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

export interface APIMeta {
  timestamp: string;
  cached?: boolean;
  source?: string;
  statusCode?: number;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: APIError;
  meta?: APIMeta;
}

// ============================================================================
// Family System Types
// ============================================================================

export type FamilyRole = 'Primary' | 'Dependent';

export interface FamilyNode {
  id: string;
  name: string;
  birthYear: number;
  birthHour?: number;
  role: FamilyRole;
  zodiacSign: ZodiacSign;
}

export interface InterferencePattern {
  resonanceIndex: number;
  dampingCoefficient: number;
  phaseCoherence: number;
  harmonicOrder: number;
}

// ============================================================================
// Temporal State Types
// ============================================================================

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
  isRetrograde?: boolean;
  utcTimestamp: string;
  dayOfEnergeticYear: number;
}

// ============================================================================
// Entanglement / System Entropy Types
// ============================================================================

export type WuXingElement = ElementType;
export type InteractionType = 'Constructive' | 'Destructive' | 'Neutral' | 'Same';

export interface ElementInteraction {
  // snake_case
  node_a_id?: string;
  node_b_id?: string;
  node_a_element?: WuXingElement;
  node_b_element?: WuXingElement;
  interaction_type?: InteractionType;
  entropy_contribution?: number;
  // camelCase aliases
  nodeAId?: string;
  nodeBId?: string;
  nodeAElement?: WuXingElement;
  nodeBElement?: WuXingElement;
  interactionType?: InteractionType;
  entropyContribution?: number;
  description?: string;
}

export interface SystemEntropyReport {
  // snake_case
  system_stress_score?: number;
  constructive_count?: number;
  destructive_count?: number;
  neutral_count?: number;
  dominant_element?: WuXingElement | null;
  stability_index?: number;
  // camelCase aliases
  systemStressScore?: number;
  constructiveCount?: number;
  destructiveCount?: number;
  neutralCount?: number;
  dominantElement?: WuXingElement | null;
  stabilityIndex?: number;
  interactions?: ElementInteraction[];
}

// ============================================================================
// Utility Type Helpers
// ============================================================================

/**
 * Makes all properties in T optional and adds snake_case/camelCase variants
 */
export type DualCasePartial<T> = {
  [P in keyof T]?: T[P];
};

/**
 * Extract the data type from an APIResponse
 */
export type ExtractAPIData<T> = T extends APIResponse<infer U> ? U : never;

/**
 * Type guard to check if a value is a valid ElementType
 */
export function isElementType(value: unknown): value is ElementType {
  return (
    typeof value === 'string' &&
    ['Wood', 'Fire', 'Earth', 'Metal', 'Water'].includes(value)
  );
}

/**
 * Type guard to check if a value is a valid ZodiacArchetype
 */
export function isZodiacArchetype(value: unknown): value is ZodiacArchetype {
  const archetypes = [
    'Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake',
    'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig',
  ];
  return typeof value === 'string' && archetypes.includes(value);
}

/**
 * Get the snake_case value regardless of input case
 */
export function getSnakeCaseValue<T>(
  obj: Record<string, T>,
  snakeKey: string,
  camelKey: string
): T | undefined {
  return obj[snakeKey] ?? obj[camelKey];
}

/**
 * Get the camelCase value regardless of input case
 */
export function getCamelCaseValue<T>(
  obj: Record<string, T>,
  snakeKey: string,
  camelKey: string
): T | undefined {
  return obj[camelKey] ?? obj[snakeKey];
}
