import { describe, it, expect, vi, beforeEach } from 'vitest'
import { showErrorToast, copyErrorDetails } from '@/lib/utils/error-toast'
import { AppError } from '@/lib/utils/error'
import { ERROR_CODES } from '@/lib/errors/codes'
import { toast } from 'sonner'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

// Mock clipboard API
const mockClipboard = {
  writeText: vi.fn(),
}
Object.defineProperty(navigator, 'clipboard', {
  value: mockClipboard,
  writable: true,
})

describe('showErrorToast', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show error toast with AppError', () => {
    const error = new AppError(ERROR_CODES.LEDGER_UNAVAILABLE, 'Service down')
    showErrorToast(error)

    expect(toast.error).toHaveBeenCalledWith(
      'Service unavailable',
      expect.objectContaining({
        description: 'Service down',
      })
    )
  })

  it('should convert standard Error to AppError', () => {
    const error = new Error('Network failed')
    showErrorToast(error)

    expect(toast.error).toHaveBeenCalled()
  })

  it('should include error ID for unknown errors', () => {
    const error = new AppError(ERROR_CODES.UNKNOWN_ERROR, 'Something broke')
    showErrorToast(error)

    expect(toast.error).toHaveBeenCalledWith(
      'An error occurred',
      expect.objectContaining({
        description: expect.stringMatching(/Something broke \(ERR-[a-zA-Z0-9_-]+\)/),
      })
    )
  })

  it('should use custom title when provided', () => {
    const error = new AppError(ERROR_CODES.LEDGER_UNAVAILABLE)
    showErrorToast(error, { title: 'Custom Title' })

    expect(toast.error).toHaveBeenCalledWith(
      'Custom Title',
      expect.anything()
    )
  })

  it('should return AppError for further processing', () => {
    const error = new Error('Test')
    const result = showErrorToast(error)
    expect(result).toBeInstanceOf(AppError)
  })

  it('should show Retry button for retryable errors with onRetry', () => {
    const onRetry = vi.fn()
    const error = new AppError(ERROR_CODES.NETWORK_TIMEOUT)
    showErrorToast(error, { onRetry })

    expect(toast.error).toHaveBeenCalledWith(
      'Request timed out',
      expect.objectContaining({
        action: expect.objectContaining({
          label: 'Retry',
        }),
      })
    )
  })

  it('should show Copy Details button for non-retryable errors', () => {
    const error = new AppError(ERROR_CODES.VALIDATION_ERROR)
    showErrorToast(error)

    expect(toast.error).toHaveBeenCalledWith(
      'Validation error',
      expect.objectContaining({
        action: expect.objectContaining({
          label: '📋 Copy details',
        }),
      })
    )
  })

  it('should use longer duration for retryable errors', () => {
    const error = new AppError(ERROR_CODES.NETWORK_TIMEOUT)
    showErrorToast(error)

    expect(toast.error).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        duration: 10000,
      })
    )
  })

  it('should use shorter duration for non-retryable errors', () => {
    const error = new AppError(ERROR_CODES.VALIDATION_ERROR)
    showErrorToast(error)

    expect(toast.error).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        duration: 5000,
      })
    )
  })
})

describe('copyErrorDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockClipboard.writeText.mockResolvedValue(undefined)
  })

  it('should copy error details to clipboard', async () => {
    const error = new AppError(ERROR_CODES.LEDGER_UNAVAILABLE, 'Service down')
    await copyErrorDetails(error)

    expect(mockClipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('"code": "LEDGER_UNAVAILABLE"')
    )
  })

  it('should include additional context in clipboard', async () => {
    const error = new AppError(ERROR_CODES.UNKNOWN_ERROR)
    await copyErrorDetails(error, { action: 'waive-fee', accountId: 'LA-001' })

    const clipboardContent = mockClipboard.writeText.mock.calls[0][0]
    expect(clipboardContent).toContain('"action": "waive-fee"')
    expect(clipboardContent).toContain('"accountId": "LA-001"')
  })

  it('should show success toast on successful copy', async () => {
    const error = new AppError(ERROR_CODES.UNKNOWN_ERROR)
    await copyErrorDetails(error)

    expect(toast.success).toHaveBeenCalledWith(
      'Error details copied',
      expect.objectContaining({
        description: 'Paste into your support ticket',
      })
    )
  })

  it('should show error toast on clipboard failure', async () => {
    mockClipboard.writeText.mockRejectedValue(new Error('Clipboard failed'))
    const error = new AppError(ERROR_CODES.UNKNOWN_ERROR)
    await copyErrorDetails(error)

    expect(toast.error).toHaveBeenCalledWith(
      'Failed to copy',
      expect.objectContaining({
        description: 'Please try again',
      })
    )
  })

  it('should return true on success', async () => {
    const error = new AppError(ERROR_CODES.UNKNOWN_ERROR)
    const result = await copyErrorDetails(error)
    expect(result).toBe(true)
  })

  it('should return false on failure', async () => {
    mockClipboard.writeText.mockRejectedValue(new Error('Failed'))
    const error = new AppError(ERROR_CODES.UNKNOWN_ERROR)
    const result = await copyErrorDetails(error)
    expect(result).toBe(false)
  })
})
