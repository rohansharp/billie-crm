'use client'

import { create } from 'zustand'

/**
 * Version information for a loan account.
 * Used for optimistic locking / conflict detection.
 */
export interface AccountVersion {
  /** ISO 8601 timestamp of when the client loaded this data */
  loadedAt: string
  /** Server's updatedAt timestamp at time of load */
  updatedAt: string
  /** Payload document ID (for lookups) */
  payloadDocId: string
}

interface VersionState {
  /** Map of loanAccountId → version info */
  versions: Map<string, AccountVersion>

  /**
   * Set/update version info for a loan account.
   * Called when customer data is loaded or refreshed.
   */
  setVersion: (loanAccountId: string, updatedAt: string, payloadDocId: string) => void

  /**
   * Get the expected version (updatedAt) for a loan account.
   * Returns undefined if no version is tracked.
   */
  getExpectedVersion: (loanAccountId: string) => string | undefined

  /**
   * Get full version info for a loan account.
   */
  getVersionInfo: (loanAccountId: string) => AccountVersion | undefined

  /**
   * Clear version info for a specific account.
   * Called after successful mutation to allow next version to be set.
   */
  clearVersion: (loanAccountId: string) => void

  /**
   * Clear all tracked versions.
   * Called on logout or full page refresh.
   */
  clearAllVersions: () => void

  /**
   * Check if a version is being tracked for an account.
   */
  hasVersion: (loanAccountId: string) => boolean
}

/**
 * Zustand store for tracking loan account versions.
 *
 * Used for optimistic locking to detect when data has been modified
 * by another user between load and mutation submission.
 *
 * @example
 * ```tsx
 * // When loading customer data:
 * const { setVersion } = useVersionStore()
 * loanAccounts.forEach(acc => {
 *   setVersion(acc.loanAccountId, acc.updatedAt, acc.id)
 * })
 *
 * // When submitting a mutation:
 * const expectedVersion = useVersionStore.getState().getExpectedVersion(loanAccountId)
 * await fetch('/api/ledger/waive-fee', {
 *   body: JSON.stringify({ ...params, expectedVersion })
 * })
 * ```
 */
export const useVersionStore = create<VersionState>((set, get) => ({
  versions: new Map(),

  setVersion: (loanAccountId, updatedAt, payloadDocId) => {
    set((state) => {
      const newVersions = new Map(state.versions)
      newVersions.set(loanAccountId, {
        loadedAt: new Date().toISOString(),
        updatedAt,
        payloadDocId,
      })
      return { versions: newVersions }
    })
  },

  getExpectedVersion: (loanAccountId) => {
    return get().versions.get(loanAccountId)?.updatedAt
  },

  getVersionInfo: (loanAccountId) => {
    return get().versions.get(loanAccountId)
  },

  clearVersion: (loanAccountId) => {
    set((state) => {
      const newVersions = new Map(state.versions)
      newVersions.delete(loanAccountId)
      return { versions: newVersions }
    })
  },

  clearAllVersions: () => {
    set({ versions: new Map() })
  },

  hasVersion: (loanAccountId) => {
    return get().versions.has(loanAccountId)
  },
}))
