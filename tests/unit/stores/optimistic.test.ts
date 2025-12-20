/**
 * Unit tests for optimistic store
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { useOptimisticStore } from '@/stores/optimistic'
import type { PendingMutation } from '@/types/mutation'

describe('useOptimisticStore', () => {
  beforeEach(() => {
    // Reset store state between tests
    const store = useOptimisticStore.getState()
    // Clear all pending mutations
    store.pendingByAccount.clear()
  })

  describe('hasPendingAction', () => {
    it('should return false when no pending actions', () => {
      const store = useOptimisticStore.getState()
      expect(store.hasPendingAction('LA-001', 'waive-fee')).toBe(false)
    })

    it('should return true when action is pending', () => {
      const store = useOptimisticStore.getState()

      const mutation: PendingMutation = {
        id: 'mut-001',
        accountId: 'LA-001',
        action: 'waive-fee',
        stage: 'optimistic',
        amount: 50,
        createdAt: Date.now(),
      }

      store.setPending('LA-001', mutation)
      expect(store.hasPendingAction('LA-001', 'waive-fee')).toBe(true)
    })

    it('should return false for different action type', () => {
      const store = useOptimisticStore.getState()

      const mutation: PendingMutation = {
        id: 'mut-001',
        accountId: 'LA-001',
        action: 'waive-fee',
        stage: 'optimistic',
        amount: 50,
        createdAt: Date.now(),
      }

      store.setPending('LA-001', mutation)
      expect(store.hasPendingAction('LA-001', 'record-repayment')).toBe(false)
    })

    it('should return false for different account', () => {
      const store = useOptimisticStore.getState()

      const mutation: PendingMutation = {
        id: 'mut-001',
        accountId: 'LA-001',
        action: 'waive-fee',
        stage: 'optimistic',
        amount: 50,
        createdAt: Date.now(),
      }

      store.setPending('LA-001', mutation)
      expect(store.hasPendingAction('LA-002', 'waive-fee')).toBe(false)
    })

    it('should return false when action has failed', () => {
      const store = useOptimisticStore.getState()

      const mutation: PendingMutation = {
        id: 'mut-001',
        accountId: 'LA-001',
        action: 'waive-fee',
        stage: 'failed',
        amount: 50,
        createdAt: Date.now(),
        error: 'Server error',
      }

      store.setPending('LA-001', mutation)
      expect(store.hasPendingAction('LA-001', 'waive-fee')).toBe(false)
    })

    it('should return true when action is confirmed but not yet cleared', () => {
      const store = useOptimisticStore.getState()

      const mutation: PendingMutation = {
        id: 'mut-001',
        accountId: 'LA-001',
        action: 'waive-fee',
        stage: 'confirmed',
        amount: 50,
        createdAt: Date.now(),
      }

      store.setPending('LA-001', mutation)
      // Confirmed actions are still "pending" until cleared after delay
      expect(store.hasPendingAction('LA-001', 'waive-fee')).toBe(true)
    })

    it('should handle multiple actions for same account', () => {
      const store = useOptimisticStore.getState()

      const waiveMutation: PendingMutation = {
        id: 'mut-001',
        accountId: 'LA-001',
        action: 'waive-fee',
        stage: 'optimistic',
        amount: 50,
        createdAt: Date.now(),
      }

      const repaymentMutation: PendingMutation = {
        id: 'mut-002',
        accountId: 'LA-001',
        action: 'record-repayment',
        stage: 'optimistic',
        amount: 100,
        createdAt: Date.now(),
      }

      store.setPending('LA-001', waiveMutation)
      store.setPending('LA-001', repaymentMutation)

      expect(store.hasPendingAction('LA-001', 'waive-fee')).toBe(true)
      expect(store.hasPendingAction('LA-001', 'record-repayment')).toBe(true)
    })

    it('should return false after action is cleared', () => {
      const store = useOptimisticStore.getState()

      const mutation: PendingMutation = {
        id: 'mut-001',
        accountId: 'LA-001',
        action: 'waive-fee',
        stage: 'optimistic',
        amount: 50,
        createdAt: Date.now(),
      }

      store.setPending('LA-001', mutation)
      expect(store.hasPendingAction('LA-001', 'waive-fee')).toBe(true)

      store.clearPending('LA-001', 'mut-001')
      expect(store.hasPendingAction('LA-001', 'waive-fee')).toBe(false)
    })
  })

  describe('setPending and getPendingForAccount', () => {
    it('should add mutation to store', () => {
      const store = useOptimisticStore.getState()

      const mutation: PendingMutation = {
        id: 'mut-001',
        accountId: 'LA-001',
        action: 'waive-fee',
        stage: 'optimistic',
        amount: 50,
        createdAt: Date.now(),
      }

      store.setPending('LA-001', mutation)
      const pending = store.getPendingForAccount('LA-001')

      expect(pending).toHaveLength(1)
      expect(pending[0].id).toBe('mut-001')
    })
  })

  describe('setStage', () => {
    it('should update mutation stage', () => {
      const store = useOptimisticStore.getState()

      const mutation: PendingMutation = {
        id: 'mut-001',
        accountId: 'LA-001',
        action: 'waive-fee',
        stage: 'optimistic',
        amount: 50,
        createdAt: Date.now(),
      }

      store.setPending('LA-001', mutation)
      store.setStage('LA-001', 'mut-001', 'confirmed')

      const pending = store.getPendingForAccount('LA-001')
      expect(pending[0].stage).toBe('confirmed')
    })

    it('should update mutation with error', () => {
      const store = useOptimisticStore.getState()

      const mutation: PendingMutation = {
        id: 'mut-001',
        accountId: 'LA-001',
        action: 'waive-fee',
        stage: 'optimistic',
        amount: 50,
        createdAt: Date.now(),
      }

      store.setPending('LA-001', mutation)
      store.setStage('LA-001', 'mut-001', 'failed', 'Network error')

      const pending = store.getPendingForAccount('LA-001')
      expect(pending[0].stage).toBe('failed')
      expect(pending[0].error).toBe('Network error')
    })
  })

  describe('hasPendingMutations', () => {
    it('should return false when no mutations', () => {
      const store = useOptimisticStore.getState()
      expect(store.hasPendingMutations('LA-001')).toBe(false)
    })

    it('should return true when has mutations', () => {
      const store = useOptimisticStore.getState()

      const mutation: PendingMutation = {
        id: 'mut-001',
        accountId: 'LA-001',
        action: 'waive-fee',
        stage: 'optimistic',
        amount: 50,
        createdAt: Date.now(),
      }

      store.setPending('LA-001', mutation)
      expect(store.hasPendingMutations('LA-001')).toBe(true)
    })
  })
})
