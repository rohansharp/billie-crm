import { NETWORK_TIMEOUT_MS } from '@/lib/constants'
import { AppError } from './error'
import { ERROR_CODES } from '@/lib/errors/codes'

/**
 * Fetch wrapper with configurable timeout.
 * Throws an AppError with NETWORK_TIMEOUT code if the request times out.
 *
 * @param url - URL to fetch
 * @param options - Standard RequestInit options
 * @param timeoutMs - Timeout in milliseconds (defaults to NETWORK_TIMEOUT_MS)
 * @returns Response from fetch
 * @throws AppError with NETWORK_TIMEOUT code on timeout
 */
export async function fetchWithTimeout(
  url: string,
  options?: RequestInit,
  timeoutMs: number = NETWORK_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)

    // Check if this was a timeout (abort)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new AppError(ERROR_CODES.NETWORK_TIMEOUT, 'Request timed out. Please try again.', {
        details: { url, timeoutMs },
      })
    }

    // Check for network errors (fetch failures)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new AppError(ERROR_CODES.NETWORK_ERROR, 'Network error. Please check your connection.', {
        details: { url, originalError: error.message },
      })
    }

    // Re-throw other errors
    throw error
  }
}

/**
 * Creates a fetch function with a pre-configured timeout.
 * Useful for creating custom fetch instances.
 *
 * @param defaultTimeoutMs - Default timeout for all requests
 * @returns Fetch function with timeout
 */
export function createFetchWithTimeout(
  defaultTimeoutMs: number = NETWORK_TIMEOUT_MS
): typeof fetchWithTimeout {
  return (url: string, options?: RequestInit, timeoutMs?: number) =>
    fetchWithTimeout(url, options, timeoutMs ?? defaultTimeoutMs)
}
