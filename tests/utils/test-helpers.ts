import { vi, beforeEach, afterEach } from 'vitest'

/**
 * Test utility functions for the Billie CRM test suite
 */

/**
 * Creates a mock event object matching the ChatLedgerEvent interface
 */
export const createMockEvent = (overrides: Partial<any> = {}) => {
  return {
    agt: 'broker',
    typ: 'test_event',
    cid: 'test-conversation-123',
    aid: 'test-application-456',
    uid: 'test-user-789',
    seq: 1,
    tsp: new Date().toISOString(),
    dat: { message: 'test data' },
    ...overrides
  }
}

/**
 * Creates a mock conversation started event
 */
export const createMockConversationStartedEvent = (overrides: Partial<any> = {}) => {
  return createMockEvent({
    typ: 'conversation_started',
    dat: {
      conversation_id: 'conv-123',
      application_number: 'APP-2024-001',
      customer_id: 'cust-789'
    },
    ...overrides
  })
}

/**
 * Creates a mock user input event
 */
export const createMockUserInputEvent = (overrides: Partial<any> = {}) => {
  return createMockEvent({
    typ: 'user_input',
    dat: {
      conversation_id: 'conv-123',
      utterance: 'I need a loan for $5000',
      answer_input_type: 'currency',
      additional_data: { amount: 5000 }
    },
    ...overrides
  })
}

/**
 * Creates a mock assistant response event
 */
export const createMockAssistantResponseEvent = (overrides: Partial<any> = {}) => {
  return createMockEvent({
    typ: 'assistant_response',
    dat: {
      u: 'I can help you with that loan application.',
      r: 'Customer requested loan, proceeding with application flow',
      a: 'text',
      d: { next_step: 'identity_verification' }
    },
    ...overrides
  })
}

/**
 * Creates a mock application detail changed event
 */
export const createMockApplicationDetailEvent = (overrides: Partial<any> = {}) => {
  return createMockEvent({
    typ: 'applicationDetail_changed',
    dat: {
      applicationNumber: 'APP-2024-001',
      customerId: 'cust-789',
      loanAmount: 5000,
      loanFee: 250,
      loanTotalPayable: 5250,
      customer: {
        customer_id: 'cust-789',
        first_name: 'John',
        last_name: 'Doe',
        email_address: { value: 'john.doe@example.com' }
      }
    },
    ...overrides
  })
}

/**
 * Waits for a specified number of milliseconds (useful for testing timeouts)
 */
export const waitFor = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Creates a mock console for testing logging
 */
export const createMockConsole = () => {
  return {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn()
  }
}

/**
 * Validates that an object matches the expected ChatLedgerEvent structure
 */
export const isValidChatLedgerEvent = (event: any): boolean => {
  return (
    typeof event === 'object' &&
    typeof event.agt === 'string' &&
    typeof event.typ === 'string' &&
    typeof event.cid === 'string' &&
    typeof event.tsp === 'string'
  )
}

/**
 * Creates a mock Redis stream message format
 */
export const createMockStreamMessage = (messageId: string, fields: string[]) => {
  return {
    messageId,
    fields
  }
}

/**
 * Converts an event object to Redis stream fields format
 */
export const eventToStreamFields = (event: any): string[] => {
  const fields: string[] = []
  
  for (const [key, value] of Object.entries(event)) {
    fields.push(key)
    fields.push(typeof value === 'object' ? JSON.stringify(value) : String(value))
  }
  
  return fields
}

/**
 * Environment variable mocking utilities
 */
export const mockEnvVars = (vars: Record<string, string>) => {
  const originalEnv = process.env
  
  beforeEach(() => {
    process.env = { ...originalEnv, ...vars }
  })
  
  afterEach(() => {
    process.env = originalEnv
  })
}

/**
 * Test timeout wrapper for async operations
 */
export const withTimeout = <T>(
  promise: Promise<T>, 
  timeoutMs: number = 5000,
  timeoutMessage = 'Operation timed out'
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    )
  ])
} 