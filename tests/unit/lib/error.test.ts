import { describe, it, expect } from 'vitest'
import {
  AppError,
  generateErrorId,
  getErrorMessage,
  isNetworkTimeout,
  isNetworkError,
  parseApiError,
  toAppError,
} from '@/lib/utils/error'
import { ERROR_CODES } from '@/lib/errors/codes'
import { ERROR_MESSAGES } from '@/lib/errors/messages'

describe('AppError', () => {
  it('should create an error with code and message', () => {
    const error = new AppError(ERROR_CODES.LEDGER_UNAVAILABLE)
    expect(error.code).toBe(ERROR_CODES.LEDGER_UNAVAILABLE)
    expect(error.message).toBe(ERROR_MESSAGES.LEDGER_UNAVAILABLE)
    expect(error.name).toBe('AppError')
  })

  it('should use custom message when provided', () => {
    const error = new AppError(ERROR_CODES.UNKNOWN_ERROR, 'Custom message')
    expect(error.message).toBe('Custom message')
  })

  it('should generate error ID', () => {
    const error = new AppError(ERROR_CODES.UNKNOWN_ERROR)
    expect(error.errorId).toMatch(/^ERR-[a-zA-Z0-9_-]{8}$/)
  })

  it('should set timestamp', () => {
    const before = new Date().toISOString()
    const error = new AppError(ERROR_CODES.UNKNOWN_ERROR)
    const after = new Date().toISOString()
    expect(error.timestamp >= before).toBe(true)
    expect(error.timestamp <= after).toBe(true)
  })

  it('should include details when provided', () => {
    const details = { foo: 'bar' }
    const error = new AppError(ERROR_CODES.UNKNOWN_ERROR, undefined, { details })
    expect(error.details).toEqual(details)
  })

  it('should use provided errorId', () => {
    const error = new AppError(ERROR_CODES.UNKNOWN_ERROR, undefined, {
      errorId: 'ERR-custom123',
    })
    expect(error.errorId).toBe('ERR-custom123')
  })

  describe('toClipboardDetails', () => {
    it('should return structured details for clipboard', () => {
      const error = new AppError(ERROR_CODES.LEDGER_UNAVAILABLE, 'Service down', {
        details: { service: 'ledger' },
      })
      const details = error.toClipboardDetails()
      expect(details.errorId).toBe(error.errorId)
      expect(details.code).toBe(ERROR_CODES.LEDGER_UNAVAILABLE)
      expect(details.message).toBe('Service down')
      expect(details.timestamp).toBe(error.timestamp)
      expect(details.details).toEqual({ service: 'ledger' })
    })
  })

  describe('isSystemError', () => {
    it('should return true for system errors', () => {
      expect(new AppError(ERROR_CODES.LEDGER_UNAVAILABLE).isSystemError()).toBe(true)
      expect(new AppError(ERROR_CODES.NETWORK_ERROR).isSystemError()).toBe(true)
      expect(new AppError(ERROR_CODES.NETWORK_TIMEOUT).isSystemError()).toBe(true)
      expect(new AppError(ERROR_CODES.UNKNOWN_ERROR).isSystemError()).toBe(true)
    })

    it('should return false for non-system errors', () => {
      expect(new AppError(ERROR_CODES.VALIDATION_ERROR).isSystemError()).toBe(false)
      expect(new AppError(ERROR_CODES.VERSION_CONFLICT).isSystemError()).toBe(false)
      expect(new AppError(ERROR_CODES.INSUFFICIENT_PRIVILEGES).isSystemError()).toBe(false)
    })
  })

  describe('isRetryable', () => {
    it('should return true for retryable errors', () => {
      expect(new AppError(ERROR_CODES.LEDGER_UNAVAILABLE).isRetryable()).toBe(true)
      expect(new AppError(ERROR_CODES.NETWORK_ERROR).isRetryable()).toBe(true)
      expect(new AppError(ERROR_CODES.NETWORK_TIMEOUT).isRetryable()).toBe(true)
    })

    it('should return false for non-retryable errors', () => {
      expect(new AppError(ERROR_CODES.UNKNOWN_ERROR).isRetryable()).toBe(false)
      expect(new AppError(ERROR_CODES.VALIDATION_ERROR).isRetryable()).toBe(false)
      expect(new AppError(ERROR_CODES.VERSION_CONFLICT).isRetryable()).toBe(false)
    })
  })
})

describe('generateErrorId', () => {
  it('should generate ID with ERR prefix', () => {
    const id = generateErrorId()
    expect(id).toMatch(/^ERR-[a-zA-Z0-9]{8}$/)
  })

  it('should generate unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateErrorId()))
    expect(ids.size).toBe(100)
  })
})

describe('getErrorMessage', () => {
  it('should return message for known error code', () => {
    expect(getErrorMessage('LEDGER_UNAVAILABLE')).toBe(ERROR_MESSAGES.LEDGER_UNAVAILABLE)
    expect(getErrorMessage('VERSION_CONFLICT')).toBe(ERROR_MESSAGES.VERSION_CONFLICT)
  })

  it('should return UNKNOWN_ERROR message for unknown code', () => {
    expect(getErrorMessage('SOME_UNKNOWN_CODE')).toBe(ERROR_MESSAGES.UNKNOWN_ERROR)
  })
})

describe('isNetworkTimeout', () => {
  it('should return true for AbortError', () => {
    const error = new Error('The operation was aborted')
    error.name = 'AbortError'
    expect(isNetworkTimeout(error)).toBe(true)
  })

  it('should return false for other errors', () => {
    expect(isNetworkTimeout(new Error('Some error'))).toBe(false)
    expect(isNetworkTimeout(null)).toBe(false)
    expect(isNetworkTimeout(undefined)).toBe(false)
  })
})

describe('isNetworkError', () => {
  it('should return true for fetch TypeError', () => {
    const error = new TypeError('Failed to fetch')
    expect(isNetworkError(error)).toBe(true)
  })

  it('should return false for other TypeErrors', () => {
    const error = new TypeError('Cannot read property')
    expect(isNetworkError(error)).toBe(false)
  })

  it('should return false for non-errors', () => {
    expect(isNetworkError(null)).toBe(false)
    expect(isNetworkError(undefined)).toBe(false)
    expect(isNetworkError('string')).toBe(false)
  })
})

describe('parseApiError', () => {
  it('should parse structured error response', async () => {
    const response = new Response(
      JSON.stringify({
        error: 'LEDGER_UNAVAILABLE',
        message: 'Service down',
        errorId: 'ERR-test1234',
        timestamp: '2025-01-01T00:00:00.000Z',
      }),
      { status: 503 }
    )

    const error = await parseApiError(response)
    expect(error.code).toBe(ERROR_CODES.LEDGER_UNAVAILABLE)
    expect(error.message).toBe('Service down')
    expect(error.errorId).toBe('ERR-test1234')
    expect(error.statusCode).toBe(503)
  })

  it('should handle version conflict with details', async () => {
    const response = new Response(
      JSON.stringify({
        error: 'VERSION_CONFLICT',
        message: 'Version mismatch',
        currentVersion: '2025-01-02',
        expectedVersion: '2025-01-01',
      }),
      { status: 409 }
    )

    const error = await parseApiError(response)
    expect(error.code).toBe(ERROR_CODES.VERSION_CONFLICT)
    expect(error.details?.currentVersion).toBe('2025-01-02')
    expect(error.details?.expectedVersion).toBe('2025-01-01')
  })

  it('should handle non-JSON response', async () => {
    const response = new Response('Internal Server Error', { status: 500 })
    const error = await parseApiError(response, 'Fallback message')
    expect(error.code).toBe(ERROR_CODES.UNKNOWN_ERROR)
    expect(error.message).toBe('Fallback message')
  })

  it('should parse error body object directly', async () => {
    const errorBody = {
      error: 'VALIDATION_ERROR',
      message: 'Invalid input',
    }

    const error = await parseApiError(errorBody)
    expect(error.code).toBe(ERROR_CODES.VALIDATION_ERROR)
    expect(error.message).toBe('Invalid input')
  })
})

describe('toAppError', () => {
  it('should return same error if already AppError', () => {
    const original = new AppError(ERROR_CODES.LEDGER_UNAVAILABLE)
    const result = toAppError(original)
    expect(result).toBe(original)
  })

  it('should convert AbortError to NETWORK_TIMEOUT', () => {
    const error = new Error('Aborted')
    error.name = 'AbortError'
    const result = toAppError(error)
    expect(result.code).toBe(ERROR_CODES.NETWORK_TIMEOUT)
  })

  it('should convert fetch TypeError to NETWORK_ERROR', () => {
    const error = new TypeError('Failed to fetch')
    const result = toAppError(error)
    expect(result.code).toBe(ERROR_CODES.NETWORK_ERROR)
  })

  it('should preserve error code from existing error', () => {
    const error = new Error('Version conflict')
    ;(error as any).code = 'VERSION_CONFLICT'
    const result = toAppError(error)
    expect(result.code).toBe(ERROR_CODES.VERSION_CONFLICT)
  })

  it('should map message to code for standard Error', () => {
    expect(toAppError(new Error('Connection unavailable')).code).toBe(ERROR_CODES.LEDGER_UNAVAILABLE)
    expect(toAppError(new Error('Validation failed')).code).toBe(ERROR_CODES.VALIDATION_ERROR)
    expect(toAppError(new Error('Not found')).code).toBe(ERROR_CODES.ACCOUNT_NOT_FOUND)
    expect(toAppError(new Error('Permission denied')).code).toBe(ERROR_CODES.INSUFFICIENT_PRIVILEGES)
  })

  it('should default to UNKNOWN_ERROR for unknown errors', () => {
    const result = toAppError('some string error')
    expect(result.code).toBe(ERROR_CODES.UNKNOWN_ERROR)
  })

  it('should handle null input gracefully', () => {
    const result = toAppError(null)
    expect(result.code).toBe(ERROR_CODES.UNKNOWN_ERROR)
    expect(result.message).toBe('An error occurred')
  })

  it('should handle undefined input gracefully', () => {
    const result = toAppError(undefined)
    expect(result.code).toBe(ERROR_CODES.UNKNOWN_ERROR)
    expect(result.message).toBe('An error occurred')
  })
})
