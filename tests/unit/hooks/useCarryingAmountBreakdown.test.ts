import { describe, test, expect } from 'vitest'
import {
  carryingAmountBreakdownQueryKey,
  type CarryingAmountBreakdownResponse,
} from '@/hooks/queries/useCarryingAmountBreakdown'

describe('useCarryingAmountBreakdown hook exports', () => {
  test('exports carryingAmountBreakdownQueryKey function', () => {
    expect(carryingAmountBreakdownQueryKey).toBeDefined()
    expect(typeof carryingAmountBreakdownQueryKey).toBe('function')
  })

  test('carryingAmountBreakdownQueryKey returns array with account id', () => {
    const key = carryingAmountBreakdownQueryKey('LOAN-123')
    expect(key[0]).toBe('carrying-amount-breakdown')
    expect(key[1]).toBe('LOAN-123')
  })

  test('carryingAmountBreakdownQueryKey handles different account ids', () => {
    const key1 = carryingAmountBreakdownQueryKey('ACC-001')
    const key2 = carryingAmountBreakdownQueryKey('ACC-002')
    expect(key1[1]).toBe('ACC-001')
    expect(key2[1]).toBe('ACC-002')
  })
})

describe('CarryingAmountBreakdownResponse type structure', () => {
  test('breakdown has correct balance properties', () => {
    const breakdown: CarryingAmountBreakdownResponse = {
      accountId: 'LOAN-123',
      principalBalance: '5000.00',
      accruedYield: '250.00',
      carryingAmount: '5250.00',
      feeBalance: '100.00',
      disbursedPrincipal: '6000.00',
      establishmentFee: '300.00',
      totalPaid: '1050.00',
      lastAccrualDate: '2026-01-17',
      daysAccrued: 45,
      termDays: 90,
      dailyAccrualRate: '5.56',
      calculationTimestamp: '2026-01-18T10:00:00Z',
    }

    expect(breakdown.accountId).toBe('LOAN-123')
    expect(breakdown.principalBalance).toBe('5000.00')
    expect(breakdown.accruedYield).toBe('250.00')
    expect(breakdown.carryingAmount).toBe('5250.00')
  })

  test('breakdown has correct accrual properties', () => {
    const breakdown: CarryingAmountBreakdownResponse = {
      accountId: 'LOAN-456',
      principalBalance: '3000.00',
      accruedYield: '150.00',
      carryingAmount: '3150.00',
      feeBalance: '75.00',
      disbursedPrincipal: '4000.00',
      establishmentFee: '200.00',
      totalPaid: '1000.00',
      lastAccrualDate: '2026-01-17',
      daysAccrued: 30,
      termDays: 60,
      dailyAccrualRate: '5.00',
      calculationTimestamp: '2026-01-18T12:30:00Z',
    }

    expect(breakdown.daysAccrued).toBe(30)
    expect(breakdown.termDays).toBe(60)
    expect(breakdown.dailyAccrualRate).toBe('5.00')
    expect(breakdown.lastAccrualDate).toBe('2026-01-17')
  })

  test('breakdown has loan details', () => {
    const breakdown: CarryingAmountBreakdownResponse = {
      accountId: 'LOAN-789',
      principalBalance: '10000.00',
      accruedYield: '500.00',
      carryingAmount: '10500.00',
      feeBalance: '250.00',
      disbursedPrincipal: '12000.00',
      establishmentFee: '600.00',
      totalPaid: '2000.00',
      lastAccrualDate: '2026-01-17',
      daysAccrued: 60,
      termDays: 120,
      dailyAccrualRate: '8.33',
      calculationTimestamp: '2026-01-18T08:00:00Z',
    }

    expect(breakdown.disbursedPrincipal).toBe('12000.00')
    expect(breakdown.establishmentFee).toBe('600.00')
    expect(breakdown.totalPaid).toBe('2000.00')
  })

  test('carrying amount calculation is valid', () => {
    const breakdown: CarryingAmountBreakdownResponse = {
      accountId: 'LOAN-001',
      principalBalance: '5000.00',
      accruedYield: '250.00',
      carryingAmount: '5250.00',
      feeBalance: '100.00',
      disbursedPrincipal: '6000.00',
      establishmentFee: '300.00',
      totalPaid: '1050.00',
      lastAccrualDate: '2026-01-17',
      daysAccrued: 45,
      termDays: 90,
      dailyAccrualRate: '5.56',
      calculationTimestamp: '2026-01-18T10:00:00Z',
    }

    // Carrying Amount = Principal + Accrued Yield
    const principal = parseFloat(breakdown.principalBalance)
    const accrued = parseFloat(breakdown.accruedYield)
    const carrying = parseFloat(breakdown.carryingAmount)

    expect(carrying).toBe(principal + accrued)
  })

  test('accrual progress is calculable', () => {
    const breakdown: CarryingAmountBreakdownResponse = {
      accountId: 'LOAN-002',
      principalBalance: '5000.00',
      accruedYield: '250.00',
      carryingAmount: '5250.00',
      feeBalance: '100.00',
      disbursedPrincipal: '6000.00',
      establishmentFee: '300.00',
      totalPaid: '1050.00',
      lastAccrualDate: '2026-01-17',
      daysAccrued: 45,
      termDays: 90,
      dailyAccrualRate: '5.56',
      calculationTimestamp: '2026-01-18T10:00:00Z',
    }

    const progress = (breakdown.daysAccrued / breakdown.termDays) * 100
    expect(progress).toBe(50)
  })
})
