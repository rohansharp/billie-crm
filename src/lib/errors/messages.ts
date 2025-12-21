export const ERROR_MESSAGES = {
  INSUFFICIENT_PRIVILEGES: 'You do not have permission to perform this action.',
  VERSION_CONFLICT:
    'This record was modified by another user. Please refresh and try again.',
  LEDGER_UNAVAILABLE:
    'The ledger service is currently unavailable. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  ACCOUNT_NOT_FOUND: 'The requested account could not be found.',
  SELF_APPROVAL_FORBIDDEN: 'You cannot approve your own request.',
  NETWORK_ERROR: 'A network error occurred. Please check your connection.',
  NETWORK_TIMEOUT: 'The request timed out. Please try again.',
  UNKNOWN_ERROR:
    'An unexpected error occurred. Please try again or contact support.',
} as const

export type ErrorCode = keyof typeof ERROR_MESSAGES
