import { describe, test, expect, beforeEach } from 'vitest'
import { useOptimisticStore } from '@/stores/optimistic'

describe('useOptimisticStore', () => {
  beforeEach(() => {
    useOptimisticStore.setState({ pendingByAccount: new Map() })
  })

  test('setPending adds mutation to account', () => {
    const { setPending, getPendingForAccount } = useOptimisticStore.getState()

    setPending('acc-123', {
      id: 'mut-1',
      accountId: 'acc-123',
      action: 'waive-fee',
      stage: 'optimistic',
      amount: -50,
      createdAt: Date.now(),
    })

    expect(getPendingForAccount('acc-123')).toHaveLength(1)
  })

  test('setStage updates mutation stage', () => {
    const { setPending, setStage, getPendingForAccount } =
      useOptimisticStore.getState()

    setPending('acc-123', {
      id: 'mut-1',
      accountId: 'acc-123',
      action: 'waive-fee',
      stage: 'optimistic',
      createdAt: Date.now(),
    })

    setStage('acc-123', 'mut-1', 'confirmed')

    expect(getPendingForAccount('acc-123')[0].stage).toBe('confirmed')
  })

  test('clearPending removes mutation', () => {
    const { setPending, clearPending, getPendingForAccount } =
      useOptimisticStore.getState()

    setPending('acc-123', {
      id: 'mut-1',
      accountId: 'acc-123',
      action: 'waive-fee',
      stage: 'optimistic',
      createdAt: Date.now(),
    })

    clearPending('acc-123', 'mut-1')

    expect(getPendingForAccount('acc-123')).toHaveLength(0)
  })

  test('getPendingAmount excludes failed mutations', () => {
    const { setPending, setStage, getPendingAmount } =
      useOptimisticStore.getState()

    setPending('acc-123', {
      id: 'mut-1',
      accountId: 'acc-123',
      action: 'fee',
      stage: 'optimistic',
      amount: -50,
      createdAt: Date.now(),
    })
    setPending('acc-123', {
      id: 'mut-2',
      accountId: 'acc-123',
      action: 'fee',
      stage: 'optimistic',
      amount: -30,
      createdAt: Date.now(),
    })

    setStage('acc-123', 'mut-2', 'failed')

    expect(getPendingAmount('acc-123')).toBe(-50)
  })

  test('hasPendingMutations returns correct boolean', () => {
    const { setPending, hasPendingMutations } = useOptimisticStore.getState()

    expect(hasPendingMutations('acc-123')).toBe(false)

    setPending('acc-123', {
      id: 'mut-1',
      accountId: 'acc-123',
      action: 'fee',
      stage: 'optimistic',
      createdAt: Date.now(),
    })

    expect(hasPendingMutations('acc-123')).toBe(true)
  })

  test('getPendingForAccount returns empty array for unknown account', () => {
    const { getPendingForAccount } = useOptimisticStore.getState()

    expect(getPendingForAccount('unknown')).toEqual([])
  })

  test('setStage can add error message on failure', () => {
    const { setPending, setStage, getPendingForAccount } =
      useOptimisticStore.getState()

    setPending('acc-123', {
      id: 'mut-1',
      accountId: 'acc-123',
      action: 'waive-fee',
      stage: 'optimistic',
      createdAt: Date.now(),
    })

    setStage('acc-123', 'mut-1', 'failed', 'Ledger unavailable')

    const pending = getPendingForAccount('acc-123')[0]
    expect(pending.stage).toBe('failed')
    expect(pending.error).toBe('Ledger unavailable')
  })
})
