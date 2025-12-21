import { describe, it, expect } from 'vitest'
import {
  ERROR_CODES,
  ERROR_STATUS_CODES,
  isSystemErrorCode,
  isValidationErrorCode,
  isRetryableErrorCode,
} from '@/lib/errors/codes'

describe('ERROR_CODES', () => {
  it('should have all expected error codes', () => {
    expect(ERROR_CODES.INSUFFICIENT_PRIVILEGES).toBe('INSUFFICIENT_PRIVILEGES')
    expect(ERROR_CODES.SELF_APPROVAL_FORBIDDEN).toBe('SELF_APPROVAL_FORBIDDEN')
    expect(ERROR_CODES.VERSION_CONFLICT).toBe('VERSION_CONFLICT')
    expect(ERROR_CODES.ACCOUNT_NOT_FOUND).toBe('ACCOUNT_NOT_FOUND')
    expect(ERROR_CODES.LEDGER_UNAVAILABLE).toBe('LEDGER_UNAVAILABLE')
    expect(ERROR_CODES.NETWORK_ERROR).toBe('NETWORK_ERROR')
    expect(ERROR_CODES.NETWORK_TIMEOUT).toBe('NETWORK_TIMEOUT')
    expect(ERROR_CODES.VALIDATION_ERROR).toBe('VALIDATION_ERROR')
    expect(ERROR_CODES.UNKNOWN_ERROR).toBe('UNKNOWN_ERROR')
  })
})

describe('ERROR_STATUS_CODES', () => {
  it('should map error codes to HTTP status codes', () => {
    expect(ERROR_STATUS_CODES[ERROR_CODES.INSUFFICIENT_PRIVILEGES]).toBe(403)
    expect(ERROR_STATUS_CODES[ERROR_CODES.VERSION_CONFLICT]).toBe(409)
    expect(ERROR_STATUS_CODES[ERROR_CODES.ACCOUNT_NOT_FOUND]).toBe(404)
    expect(ERROR_STATUS_CODES[ERROR_CODES.LEDGER_UNAVAILABLE]).toBe(503)
    expect(ERROR_STATUS_CODES[ERROR_CODES.NETWORK_TIMEOUT]).toBe(408)
    expect(ERROR_STATUS_CODES[ERROR_CODES.VALIDATION_ERROR]).toBe(400)
    expect(ERROR_STATUS_CODES[ERROR_CODES.UNKNOWN_ERROR]).toBe(500)
  })
})

describe('isSystemErrorCode', () => {
  it('should return true for system error codes', () => {
    expect(isSystemErrorCode(ERROR_CODES.LEDGER_UNAVAILABLE)).toBe(true)
    expect(isSystemErrorCode(ERROR_CODES.NETWORK_ERROR)).toBe(true)
    expect(isSystemErrorCode(ERROR_CODES.NETWORK_TIMEOUT)).toBe(true)
    expect(isSystemErrorCode(ERROR_CODES.UNKNOWN_ERROR)).toBe(true)
  })

  it('should return false for non-system error codes', () => {
    expect(isSystemErrorCode(ERROR_CODES.VALIDATION_ERROR)).toBe(false)
    expect(isSystemErrorCode(ERROR_CODES.VERSION_CONFLICT)).toBe(false)
    expect(isSystemErrorCode(ERROR_CODES.INSUFFICIENT_PRIVILEGES)).toBe(false)
    expect(isSystemErrorCode(ERROR_CODES.ACCOUNT_NOT_FOUND)).toBe(false)
  })

  it('should return false for unknown codes', () => {
    expect(isSystemErrorCode('UNKNOWN_CODE_XYZ')).toBe(false)
  })
})

describe('isValidationErrorCode', () => {
  it('should return true for VALIDATION_ERROR', () => {
    expect(isValidationErrorCode(ERROR_CODES.VALIDATION_ERROR)).toBe(true)
  })

  it('should return false for other codes', () => {
    expect(isValidationErrorCode(ERROR_CODES.LEDGER_UNAVAILABLE)).toBe(false)
    expect(isValidationErrorCode(ERROR_CODES.UNKNOWN_ERROR)).toBe(false)
  })
})

describe('isRetryableErrorCode', () => {
  it('should return true for retryable error codes', () => {
    expect(isRetryableErrorCode(ERROR_CODES.LEDGER_UNAVAILABLE)).toBe(true)
    expect(isRetryableErrorCode(ERROR_CODES.NETWORK_ERROR)).toBe(true)
    expect(isRetryableErrorCode(ERROR_CODES.NETWORK_TIMEOUT)).toBe(true)
  })

  it('should return false for non-retryable error codes', () => {
    // UNKNOWN_ERROR is a system error but not retryable
    expect(isRetryableErrorCode(ERROR_CODES.UNKNOWN_ERROR)).toBe(false)
    expect(isRetryableErrorCode(ERROR_CODES.VALIDATION_ERROR)).toBe(false)
    expect(isRetryableErrorCode(ERROR_CODES.VERSION_CONFLICT)).toBe(false)
  })
})
