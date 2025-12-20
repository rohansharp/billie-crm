/**
 * Unit tests for useRecordRepayment hook
 */
import { describe, it, expect } from 'vitest'
import {
  useRecordRepayment,
  RecordRepaymentParams,
  RecordRepaymentResponse,
  RepaymentAllocation,
} from '@/hooks/mutations/useRecordRepayment'

describe('useRecordRepayment', () => {
  describe('exports', () => {
    it('should export the useRecordRepayment hook', () => {
      expect(useRecordRepayment).toBeDefined()
      expect(typeof useRecordRepayment).toBe('function')
    })

    it('should export RecordRepaymentParams type', () => {
      const params: RecordRepaymentParams = {
        loanAccountId: 'LA-001',
        amount: 100.0,
        paymentReference: 'PAY-001',
        paymentMethod: 'bank_transfer',
        notes: 'Test payment',
      }
      expect(params.loanAccountId).toBe('LA-001')
      expect(params.amount).toBe(100.0)
    })

    it('should export RecordRepaymentResponse type', () => {
      const response: RecordRepaymentResponse = {
        success: true,
        transaction: {
          id: 'tx-001',
          accountId: 'LA-001',
          type: 'REPAYMENT',
          typeLabel: 'Repayment',
          date: '2025-01-01T00:00:00Z',
          principalDelta: -80.0,
          feeDelta: -20.0,
          totalDelta: -100.0,
          principalAfter: 400.0,
          feeAfter: 0,
          totalAfter: 400.0,
          description: 'Payment received',
        },
        eventId: 'event-001',
        allocation: {
          allocatedToFees: 20.0,
          allocatedToPrincipal: 80.0,
          overpayment: 0,
        },
      }
      expect(response.success).toBe(true)
      expect(response.allocation.allocatedToPrincipal).toBe(80.0)
    })

    it('should export RepaymentAllocation type', () => {
      const allocation: RepaymentAllocation = {
        allocatedToFees: 15.5,
        allocatedToPrincipal: 84.5,
        overpayment: 0,
      }
      expect(allocation.allocatedToFees).toBe(15.5)
      expect(allocation.overpayment).toBe(0)
    })
  })

  describe('RecordRepaymentParams', () => {
    it('should require loanAccountId', () => {
      const params: RecordRepaymentParams = {
        loanAccountId: 'LA-12345',
        amount: 50.0,
        paymentReference: 'REF-001',
        paymentMethod: 'card',
      }
      expect(params.loanAccountId).toBe('LA-12345')
    })

    it('should require amount as number', () => {
      const params: RecordRepaymentParams = {
        loanAccountId: 'LA-001',
        amount: 99.99,
        paymentReference: 'REF-002',
        paymentMethod: 'direct_debit',
      }
      expect(typeof params.amount).toBe('number')
    })

    it('should require paymentReference', () => {
      const params: RecordRepaymentParams = {
        loanAccountId: 'LA-001',
        amount: 50,
        paymentReference: 'DD-20240301-001',
        paymentMethod: 'bpay',
      }
      expect(params.paymentReference).toBe('DD-20240301-001')
    })

    it('should allow optional notes', () => {
      const paramsWithNotes: RecordRepaymentParams = {
        loanAccountId: 'LA-001',
        amount: 50,
        paymentReference: 'REF-003',
        paymentMethod: 'cash',
        notes: 'Customer paid at branch',
      }
      expect(paramsWithNotes.notes).toBe('Customer paid at branch')

      const paramsWithoutNotes: RecordRepaymentParams = {
        loanAccountId: 'LA-001',
        amount: 50,
        paymentReference: 'REF-004',
        paymentMethod: 'bank_transfer',
      }
      expect(paramsWithoutNotes.notes).toBeUndefined()
    })
  })

  describe('RecordRepaymentResponse', () => {
    it('should include allocation breakdown', () => {
      const response: RecordRepaymentResponse = {
        success: true,
        transaction: {
          id: 'tx-002',
          accountId: 'LA-002',
          type: 'REPAYMENT',
          typeLabel: 'Repayment',
          date: '2025-02-01T12:00:00Z',
          principalDelta: -50,
          feeDelta: -10,
          totalDelta: -60,
          principalAfter: 250,
          feeAfter: 0,
          totalAfter: 250,
          description: 'Payment',
        },
        eventId: 'evt-002',
        allocation: {
          allocatedToFees: 10,
          allocatedToPrincipal: 50,
          overpayment: 0,
        },
      }
      expect(response.allocation.allocatedToFees).toBe(10)
      expect(response.allocation.allocatedToPrincipal).toBe(50)
    })

    it('should track overpayment', () => {
      const response: RecordRepaymentResponse = {
        success: true,
        transaction: {
          id: 'tx-003',
          accountId: 'LA-003',
          type: 'REPAYMENT',
          typeLabel: 'Repayment',
          date: '2025-03-01',
          principalDelta: -100,
          feeDelta: -10,
          totalDelta: -110,
          principalAfter: 0,
          feeAfter: 0,
          totalAfter: 0,
          description: 'Final payment with overpayment',
        },
        eventId: 'evt-003',
        allocation: {
          allocatedToFees: 10,
          allocatedToPrincipal: 100,
          overpayment: 40,
        },
      }
      expect(response.allocation.overpayment).toBe(40)
    })
  })
})
