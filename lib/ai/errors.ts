// lib/ai/errors.ts

/**
 * Maps raw SDK/API errors to clean, user-facing messages.
 * Use in every API route catch block instead of exposing error.message directly.
 *
 * @param error   - The caught error object
 * @param context - Optional context string to customize the fallback message
 *                  e.g. 'analyze your match', 'generate insights', 'analyze your answers'
 */
export function getApiErrorMessage(error: any, context = 'process your request'): string {
  const msg = error?.message || ''

  if (
    msg.includes('429') ||
    msg.includes('quota') ||
    msg.includes('Too Many Requests') ||
    msg.includes('RESOURCE_EXHAUSTED')
  ) {
    return 'AI service is temporarily unavailable. Please try again later.'
  }
  if (msg.includes('401') || msg.includes('API key') || msg.includes('UNAUTHENTICATED')) {
    return 'AI service configuration error. Please contact support.'
  }
  if (msg.includes('403') || msg.includes('PERMISSION_DENIED')) {
    return 'Access to AI service was denied. Please contact support.'
  }
  if (msg.includes('400') || msg.includes('INVALID_ARGUMENT')) {
    return 'The request could not be processed. Please try again.'
  }
  if (msg.includes('503') || msg.includes('UNAVAILABLE')) {
    return 'AI service is currently unavailable. Please try again later.'
  }
  if (msg.includes('404') || msg.includes('not found')) {
    return 'AI model not found. Please check your configuration.'
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('ECONNREFUSED')) {
    return 'Network error. Please check your connection and try again.'
  }

  return `Failed to ${context}. Please try again.`
}

/**
 * Derives a clean HTTP status code from a raw error to return to the client.
 * Defaults to 500 if no known pattern is matched.
 */
export function getHttpStatus(error: any): number {
  const msg = error?.message || ''

  if (msg.includes('429') || msg.includes('quota') || msg.includes('Too Many Requests')) return 429
  if (msg.includes('401') || msg.includes('API key') || msg.includes('UNAUTHENTICATED')) return 401
  if (msg.includes('403') || msg.includes('PERMISSION_DENIED')) return 403
  if (msg.includes('400') || msg.includes('INVALID_ARGUMENT')) return 400
  if (msg.includes('503') || msg.includes('UNAVAILABLE')) return 503

  return 500
}