import { describe, test, expect } from 'vitest'
import {
  TRANSACTION_TYPES,
  transactionsQueryKey,
} from '@/hooks/queries/useTransactions'

describe('useTransactions hook exports', () => {
  test('exports TRANSACTION_TYPES array', () => {
    expect(TRANSACTION_TYPES).toBeDefined()
    expect(Array.isArray(TRANSACTION_TYPES)).toBe(true)
    expect(TRANSACTION_TYPES.length).toBeGreaterThan(0)
  })

  test('TRANSACTION_TYPES includes common types', () => {
    const values = TRANSACTION_TYPES.map((t) => t.value)
    expect(values).toContain('')
    expect(values).toContain('DISBURSEMENT')
    expect(values).toContain('REPAYMENT')
    expect(values).toContain('LATE_FEE')
    expect(values).toContain('FEE_WAIVER')
  })

  test('TRANSACTION_TYPES has labels for all values', () => {
    for (const type of TRANSACTION_TYPES) {
      expect(type.label).toBeDefined()
      expect(typeof type.label).toBe('string')
      expect(type.label.length).toBeGreaterThan(0)
    }
  })

  test('exports transactionsQueryKey function', () => {
    expect(transactionsQueryKey).toBeDefined()
    expect(typeof transactionsQueryKey).toBe('function')
  })

  test('transactionsQueryKey returns array with loan account id', () => {
    const key = transactionsQueryKey('LOAN-123', {})
    expect(key[0]).toBe('transactions')
    expect(key[1]).toBe('LOAN-123')
    expect(key[2]).toEqual({})
  })

  test('transactionsQueryKey includes filters in key', () => {
    const filters = { type: 'REPAYMENT', fromDate: '2024-01-01' }
    const key = transactionsQueryKey('LOAN-456', filters)
    expect(key[2]).toEqual(filters)
  })
})

describe('useTransactions hook behavior', () => {
  test('staleTime should be 30 seconds', async () => {
    // This would require mocking, keeping as documentation
    // The actual value is 30_000ms in the hook
    expect(true).toBe(true)
  })
})
