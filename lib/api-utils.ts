/**
 * Standardized API Response Utilities
 *
 * Provides consistent response formatting with both snake_case and camelCase field aliases.
 * This ensures API compatibility with different client conventions.
 */

// ============================================================================
// Type Definitions
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
  // camelCase aliases
  status_code?: number;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: APIError;
  meta?: APIMeta;
}

// Standard error codes
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  CACHE_ERROR: 'CACHE_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// ============================================================================
// Case Conversion Utilities
// ============================================================================

/**
 * Convert snake_case to camelCase
 *
 * @example
 * toCamelCase('hello_world') // 'helloWorld'
 * toCamelCase('kp_index') // 'kpIndex'
 */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert camelCase to snake_case
 *
 * @example
 * toSnakeCase('helloWorld') // 'hello_world'
 * toSnakeCase('kpIndex') // 'kp_index'
 */
export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Recursively add camelCase aliases to an object with snake_case keys
 */
export function addCamelCaseAliases<T extends Record<string, unknown>>(
  obj: T
): T & Record<string, unknown> {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) =>
      typeof item === 'object' && item !== null
        ? addCamelCaseAliases(item as Record<string, unknown>)
        : item
    ) as unknown as T & Record<string, unknown>;
  }

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Handle nested objects
    const processedValue =
      typeof value === 'object' && value !== null
        ? addCamelCaseAliases(value as Record<string, unknown>)
        : value;

    // Add original key
    result[key] = processedValue;

    // Add camelCase alias if different
    const camelKey = toCamelCase(key);
    if (camelKey !== key) {
      result[camelKey] = processedValue;
    }
  }

  return result as T & Record<string, unknown>;
}

/**
 * Recursively add snake_case aliases to an object with camelCase keys
 */
export function addSnakeCaseAliases<T extends Record<string, unknown>>(
  obj: T
): T & Record<string, unknown> {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) =>
      typeof item === 'object' && item !== null
        ? addSnakeCaseAliases(item as Record<string, unknown>)
        : item
    ) as unknown as T & Record<string, unknown>;
  }

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Handle nested objects
    const processedValue =
      typeof value === 'object' && value !== null
        ? addSnakeCaseAliases(value as Record<string, unknown>)
        : value;

    // Add original key
    result[key] = processedValue;

    // Add snake_case alias if different
    const snakeKey = toSnakeCase(key);
    if (snakeKey !== key) {
      result[snakeKey] = processedValue;
    }
  }

  return result as T & Record<string, unknown>;
}

/**
 * Add both snake_case and camelCase aliases to ensure full compatibility
 */
export function addDualCaseAliases<T extends Record<string, unknown>>(
  obj: T
): T & Record<string, unknown> {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) =>
      typeof item === 'object' && item !== null
        ? addDualCaseAliases(item as Record<string, unknown>)
        : item
    ) as unknown as T & Record<string, unknown>;
  }

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Handle nested objects
    const processedValue =
      typeof value === 'object' && value !== null
        ? addDualCaseAliases(value as Record<string, unknown>)
        : value;

    // Add original key
    result[key] = processedValue;

    // Add camelCase alias
    const camelKey = toCamelCase(key);
    if (camelKey !== key) {
      result[camelKey] = processedValue;
    }

    // Add snake_case alias
    const snakeKey = toSnakeCase(key);
    if (snakeKey !== key) {
      result[snakeKey] = processedValue;
    }
  }

  return result as T & Record<string, unknown>;
}

// ============================================================================
// Response Creation Functions
// ============================================================================

/**
 * Create a successful API response with dual-case support
 */
export function createSuccessResponse<T>(
  data: T,
  options: {
    cached?: boolean;
    source?: string;
  } = {}
): APIResponse<T> {
  const meta: APIMeta = {
    timestamp: new Date().toISOString(),
    ...(options.cached !== undefined && { cached: options.cached }),
    ...(options.source && { source: options.source }),
  };

  // Process data to add dual-case aliases
  const processedData =
    typeof data === 'object' && data !== null
      ? addDualCaseAliases(data as Record<string, unknown>)
      : data;

  return {
    success: true,
    data: processedData as T,
    meta: addDualCaseAliases(meta as Record<string, unknown>) as APIMeta,
  };
}

/**
 * Create an error API response
 */
export function createErrorResponse(
  code: ErrorCode | string,
  message: string,
  options: {
    field?: string;
    details?: Record<string, unknown>;
    statusCode?: number;
  } = {}
): APIResponse<never> {
  const error: APIError = {
    code,
    message,
    ...(options.field && { field: options.field }),
    ...(options.details && {
      details: addDualCaseAliases(options.details),
    }),
  };

  const meta: APIMeta = {
    timestamp: new Date().toISOString(),
    ...(options.statusCode && {
      statusCode: options.statusCode,
      status_code: options.statusCode,
    }),
  };

  return {
    success: false,
    error,
    meta: addDualCaseAliases(meta as Record<string, unknown>) as APIMeta,
  };
}

// ============================================================================
// NextResponse Helpers (for Next.js API routes)
// ============================================================================

import { NextResponse } from 'next/server';

/**
 * Create a successful NextResponse with standardized format
 */
export function successResponse<T>(
  data: T,
  options: {
    cached?: boolean;
    source?: string;
    status?: number;
  } = {}
): NextResponse<APIResponse<T>> {
  const response = createSuccessResponse(data, {
    cached: options.cached,
    source: options.source,
  });

  return NextResponse.json(response, { status: options.status || 200 });
}

/**
 * Create an error NextResponse with standardized format
 */
export function errorResponse(
  code: ErrorCode | string,
  message: string,
  options: {
    field?: string;
    details?: Record<string, unknown>;
    status?: number;
  } = {}
): NextResponse<APIResponse<never>> {
  const statusCode = options.status || 400;
  const response = createErrorResponse(code, message, {
    field: options.field,
    details: options.details,
    statusCode,
  });

  return NextResponse.json(response, { status: statusCode });
}

/**
 * Create a validation error response
 */
export function validationError(
  message: string,
  field?: string,
  details?: Record<string, unknown>
): NextResponse<APIResponse<never>> {
  return errorResponse(ErrorCodes.VALIDATION_ERROR, message, {
    field,
    details,
    status: 400,
  });
}

/**
 * Create a not found error response
 */
export function notFoundError(
  message: string = 'Resource not found',
  details?: Record<string, unknown>
): NextResponse<APIResponse<never>> {
  return errorResponse(ErrorCodes.NOT_FOUND, message, {
    details,
    status: 404,
  });
}

/**
 * Create a service unavailable error response
 */
export function serviceUnavailableError(
  message: string = 'Service temporarily unavailable',
  details?: Record<string, unknown>
): NextResponse<APIResponse<never>> {
  return errorResponse(ErrorCodes.SERVICE_UNAVAILABLE, message, {
    details,
    status: 503,
  });
}

/**
 * Create an internal server error response
 */
export function internalError(
  message: string = 'Internal server error',
  details?: Record<string, unknown>
): NextResponse<APIResponse<never>> {
  return errorResponse(ErrorCodes.INTERNAL_ERROR, message, {
    details,
    status: 500,
  });
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if response is successful
 */
export function isSuccessResponse<T>(
  response: APIResponse<T>
): response is APIResponse<T> & { success: true; data: T } {
  return response.success === true && response.data !== undefined;
}

/**
 * Type guard to check if response is an error
 */
export function isErrorResponse<T>(
  response: APIResponse<T>
): response is APIResponse<T> & { success: false; error: APIError } {
  return response.success === false && response.error !== undefined;
}
