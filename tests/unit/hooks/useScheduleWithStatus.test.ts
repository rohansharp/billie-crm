import { describe, test, expect } from 'vitest'
import {
  scheduleWithStatusQueryKey,
  type InstalmentWithStatus,
  type ScheduleSummary,
  type ScheduleWithStatusResponse,
} from '@/hooks/queries/useScheduleWithStatus'

describe('useScheduleWithStatus hook exports', () => {
  test('exports scheduleWithStatusQueryKey function', () => {
    expect(scheduleWithStatusQueryKey).toBeDefined()
    expect(typeof scheduleWithStatusQueryKey).toBe('function')
  })

  test('scheduleWithStatusQueryKey returns array with account id', () => {
    const key = scheduleWithStatusQueryKey('LOAN-123')
    expect(key[0]).toBe('schedule-with-status')
    expect(key[1]).toBe('LOAN-123')
  })

  test('scheduleWithStatusQueryKey handles different account ids', () => {
    const key1 = scheduleWithStatusQueryKey('ACC-001')
    const key2 = scheduleWithStatusQueryKey('ACC-002')
    expect(key1[1]).toBe('ACC-001')
    expect(key2[1]).toBe('ACC-002')
  })
})

describe('InstalmentWithStatus type structure', () => {
  test('instalment has correct properties', () => {
    const instalment: InstalmentWithStatus = {
      paymentNumber: 1,
      dueDate: '2026-02-15',
      scheduledAmount: '100.00',
      status: 'PENDING',
      amountPaid: '0.00',
      amountRemaining: '100.00',
      linkedTransactionIds: [],
    }

    expect(instalment.paymentNumber).toBe(1)
    expect(instalment.status).toBe('PENDING')
    expect(instalment.scheduledAmount).toBe('100.00')
  })

  test('instalment with PAID status', () => {
    const instalment: InstalmentWithStatus = {
      paymentNumber: 1,
      dueDate: '2026-01-15',
      scheduledAmount: '100.00',
      status: 'PAID',
      amountPaid: '100.00',
      amountRemaining: '0.00',
      paidDate: '2026-01-14',
      linkedTransactionIds: ['TXN-001'],
    }

    expect(instalment.status).toBe('PAID')
    expect(instalment.paidDate).toBe('2026-01-14')
    expect(instalment.linkedTransactionIds).toContain('TXN-001')
  })

  test('instalment with PARTIAL status', () => {
    const instalment: InstalmentWithStatus = {
      paymentNumber: 2,
      dueDate: '2026-01-30',
      scheduledAmount: '100.00',
      status: 'PARTIAL',
      amountPaid: '50.00',
      amountRemaining: '50.00',
      linkedTransactionIds: ['TXN-002'],
    }

    expect(instalment.status).toBe('PARTIAL')
    expect(instalment.amountPaid).toBe('50.00')
    expect(instalment.amountRemaining).toBe('50.00')
  })

  test('instalment with OVERDUE status', () => {
    const instalment: InstalmentWithStatus = {
      paymentNumber: 3,
      dueDate: '2025-12-15',
      scheduledAmount: '100.00',
      status: 'OVERDUE',
      amountPaid: '0.00',
      amountRemaining: '100.00',
      linkedTransactionIds: [],
    }

    expect(instalment.status).toBe('OVERDUE')
    expect(instalment.amountRemaining).toBe('100.00')
  })
})

describe('ScheduleSummary type structure', () => {
  test('summary has correct properties', () => {
    const summary: ScheduleSummary = {
      totalInstalments: 12,
      paidCount: 3,
      partialCount: 1,
      overdueCount: 0,
      pendingCount: 8,
      nextDueDate: '2026-02-15',
      nextDueAmount: '100.00',
      totalScheduled: '1200.00',
      totalPaid: '350.00',
      totalRemaining: '850.00',
    }

    expect(summary.totalInstalments).toBe(12)
    expect(summary.paidCount).toBe(3)
    expect(summary.pendingCount).toBe(8)
  })

  test('summary without next due (all paid)', () => {
    const summary: ScheduleSummary = {
      totalInstalments: 12,
      paidCount: 12,
      partialCount: 0,
      overdueCount: 0,
      pendingCount: 0,
      totalScheduled: '1200.00',
      totalPaid: '1200.00',
      totalRemaining: '0.00',
    }

    expect(summary.nextDueDate).toBeUndefined()
    expect(summary.nextDueAmount).toBeUndefined()
  })
})

describe('ScheduleWithStatusResponse type structure', () => {
  test('response has correct properties', () => {
    const response: ScheduleWithStatusResponse = {
      scheduleId: 'SCHED-001',
      loanAccountId: 'LOAN-123',
      customerId: 'CUST-456',
      applicationNumber: 'APP-789',
      instalments: [],
      summary: {
        totalInstalments: 0,
        paidCount: 0,
        partialCount: 0,
        overdueCount: 0,
        pendingCount: 0,
        totalScheduled: '0.00',
        totalPaid: '0.00',
        totalRemaining: '0.00',
      },
    }

    expect(response.scheduleId).toBe('SCHED-001')
    expect(response.loanAccountId).toBe('LOAN-123')
    expect(response.instalments).toEqual([])
  })
})
