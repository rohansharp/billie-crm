'use client'

import { create } from 'zustand'
import type { PendingMutation, MutationStage } from '@/types/mutation'

interface OptimisticState {
  pendingByAccount: Map<string, Map<string, PendingMutation>>
  setPending: (accountId: string, mutation: PendingMutation) => void
  setStage: (
    accountId: string,
    mutationId: string,
    stage: MutationStage,
    error?: string,
  ) => void
  clearPending: (accountId: string, mutationId: string) => void
  getPendingForAccount: (accountId: string) => PendingMutation[]
  getPendingAmount: (accountId: string) => number
  hasPendingMutations: (accountId: string) => boolean
}

export const useOptimisticStore = create<OptimisticState>((set, get) => ({
  pendingByAccount: new Map(),

  setPending: (accountId, mutation) => {
    set((state) => {
      const newMap = new Map(state.pendingByAccount)
      const accountMutations = new Map(newMap.get(accountId) || new Map())
      accountMutations.set(mutation.id, mutation)
      newMap.set(accountId, accountMutations)
      return { pendingByAccount: newMap }
    })
  },

  setStage: (accountId, mutationId, stage, error) => {
    set((state) => {
      const newMap = new Map(state.pendingByAccount)
      const accountMutations = new Map(newMap.get(accountId) || new Map())
      const mutation = accountMutations.get(mutationId)
      if (mutation) {
        accountMutations.set(mutationId, { ...mutation, stage, error })
        newMap.set(accountId, accountMutations)
      }
      return { pendingByAccount: newMap }
    })
  },

  clearPending: (accountId, mutationId) => {
    set((state) => {
      const newMap = new Map(state.pendingByAccount)
      const accountMutations = new Map(newMap.get(accountId) || new Map())
      accountMutations.delete(mutationId)
      if (accountMutations.size === 0) {
        newMap.delete(accountId)
      } else {
        newMap.set(accountId, accountMutations)
      }
      return { pendingByAccount: newMap }
    })
  },

  getPendingForAccount: (accountId) => {
    const accountMutations = get().pendingByAccount.get(accountId)
    return accountMutations ? Array.from(accountMutations.values()) : []
  },

  getPendingAmount: (accountId) => {
    const pending = get().getPendingForAccount(accountId)
    return pending
      .filter((m) => m.stage !== 'failed')
      .reduce((sum, m) => sum + (m.amount || 0), 0)
  },

  hasPendingMutations: (accountId) => {
    return get().getPendingForAccount(accountId).length > 0
  },
}))
