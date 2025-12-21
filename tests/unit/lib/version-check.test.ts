import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkVersion, createVersionConflictResponse } from '@/lib/utils/version-check'
import { VERSION_CONFLICT_ERROR_CODE } from '@/lib/constants'
import { ERROR_MESSAGES } from '@/lib/errors/messages'

// Mock Payload
vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({
    find: vi.fn(),
  }),
}))

// Mock payload config
vi.mock('@payload-config', () => ({
  default: {},
}))

describe('checkVersion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return valid when no expectedVersion is provided', async () => {
    const result = await checkVersion('LOAN-123')
    
    expect(result.isValid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('should return valid when expectedVersion is undefined', async () => {
    const result = await checkVersion('LOAN-123', undefined)
    
    expect(result.isValid).toBe(true)
  })

  it('should return valid when account not found in database', async () => {
    const { getPayload } = await import('payload')
    ;(getPayload as any).mockResolvedValue({
      find: vi.fn().mockResolvedValue({ docs: [] }),
    })

    const result = await checkVersion('LOAN-UNKNOWN', '2025-12-11T06:00:00.000Z')
    
    expect(result.isValid).toBe(true)
  })

  it('should return valid when versions match', async () => {
    const { getPayload } = await import('payload')
    ;(getPayload as any).mockResolvedValue({
      find: vi.fn().mockResolvedValue({
        docs: [{ loanAccountId: 'LOAN-123', updatedAt: '2025-12-11T06:00:00.000Z' }],
      }),
    })

    const result = await checkVersion('LOAN-123', '2025-12-11T06:00:00.000Z')
    
    expect(result.isValid).toBe(true)
    expect(result.currentVersion).toBe('2025-12-11T06:00:00.000Z')
    expect(result.expectedVersion).toBe('2025-12-11T06:00:00.000Z')
  })

  it('should return invalid with error when versions do not match', async () => {
    const { getPayload } = await import('payload')
    ;(getPayload as any).mockResolvedValue({
      find: vi.fn().mockResolvedValue({
        docs: [{ loanAccountId: 'LOAN-123', updatedAt: '2025-12-11T07:00:00.000Z' }],
      }),
    })

    const result = await checkVersion('LOAN-123', '2025-12-11T06:00:00.000Z')
    
    expect(result.isValid).toBe(false)
    expect(result.currentVersion).toBe('2025-12-11T07:00:00.000Z')
    expect(result.expectedVersion).toBe('2025-12-11T06:00:00.000Z')
    expect(result.error).toEqual({
      code: VERSION_CONFLICT_ERROR_CODE,
      message: ERROR_MESSAGES.VERSION_CONFLICT,
      currentVersion: '2025-12-11T07:00:00.000Z',
      expectedVersion: '2025-12-11T06:00:00.000Z',
    })
  })

  it('should return valid when database throws error (fail open)', async () => {
    const { getPayload } = await import('payload')
    ;(getPayload as any).mockRejectedValue(new Error('Database connection failed'))

    const result = await checkVersion('LOAN-123', '2025-12-11T06:00:00.000Z')
    
    // Fail open - allow request to proceed
    expect(result.isValid).toBe(true)
  })
})

describe('createVersionConflictResponse', () => {
  it('should create a properly formatted error response', () => {
    const result = {
      isValid: false,
      currentVersion: '2025-12-11T07:00:00.000Z',
      expectedVersion: '2025-12-11T06:00:00.000Z',
    }

    const response = createVersionConflictResponse(result)

    expect(response).toEqual({
      error: VERSION_CONFLICT_ERROR_CODE,
      message: ERROR_MESSAGES.VERSION_CONFLICT,
      currentVersion: '2025-12-11T07:00:00.000Z',
      expectedVersion: '2025-12-11T06:00:00.000Z',
    })
  })
})
