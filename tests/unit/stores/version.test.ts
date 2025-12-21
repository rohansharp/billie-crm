import { describe, it, expect, beforeEach } from 'vitest'
import { useVersionStore } from '@/stores/version'

describe('useVersionStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useVersionStore.setState({ versions: new Map() })
  })

  describe('setVersion', () => {
    it('should set version info for a loan account', () => {
      const store = useVersionStore.getState()

      store.setVersion('LOAN-123', '2025-12-11T06:00:00.000Z', 'doc-abc')

      const version = store.getVersionInfo('LOAN-123')
      expect(version).toBeDefined()
      expect(version?.updatedAt).toBe('2025-12-11T06:00:00.000Z')
      expect(version?.payloadDocId).toBe('doc-abc')
      expect(version?.loadedAt).toBeDefined()
    })

    it('should update existing version info', () => {
      const store = useVersionStore.getState()

      store.setVersion('LOAN-123', '2025-12-11T06:00:00.000Z', 'doc-abc')
      store.setVersion('LOAN-123', '2025-12-11T07:00:00.000Z', 'doc-abc')

      const version = store.getVersionInfo('LOAN-123')
      expect(version?.updatedAt).toBe('2025-12-11T07:00:00.000Z')
    })

    it('should track multiple accounts independently', () => {
      const store = useVersionStore.getState()

      store.setVersion('LOAN-123', '2025-12-11T06:00:00.000Z', 'doc-abc')
      store.setVersion('LOAN-456', '2025-12-11T07:00:00.000Z', 'doc-def')

      expect(store.getExpectedVersion('LOAN-123')).toBe('2025-12-11T06:00:00.000Z')
      expect(store.getExpectedVersion('LOAN-456')).toBe('2025-12-11T07:00:00.000Z')
    })
  })

  describe('getExpectedVersion', () => {
    it('should return updatedAt for tracked account', () => {
      const store = useVersionStore.getState()

      store.setVersion('LOAN-123', '2025-12-11T06:00:00.000Z', 'doc-abc')

      expect(store.getExpectedVersion('LOAN-123')).toBe('2025-12-11T06:00:00.000Z')
    })

    it('should return undefined for untracked account', () => {
      const store = useVersionStore.getState()

      expect(store.getExpectedVersion('LOAN-UNKNOWN')).toBeUndefined()
    })
  })

  describe('getVersionInfo', () => {
    it('should return full version info', () => {
      const store = useVersionStore.getState()

      store.setVersion('LOAN-123', '2025-12-11T06:00:00.000Z', 'doc-abc')

      const info = store.getVersionInfo('LOAN-123')
      expect(info).toEqual({
        loadedAt: expect.any(String),
        updatedAt: '2025-12-11T06:00:00.000Z',
        payloadDocId: 'doc-abc',
      })
    })

    it('should return undefined for untracked account', () => {
      const store = useVersionStore.getState()

      expect(store.getVersionInfo('LOAN-UNKNOWN')).toBeUndefined()
    })
  })

  describe('clearVersion', () => {
    it('should remove version info for specific account', () => {
      const store = useVersionStore.getState()

      store.setVersion('LOAN-123', '2025-12-11T06:00:00.000Z', 'doc-abc')
      store.setVersion('LOAN-456', '2025-12-11T07:00:00.000Z', 'doc-def')

      store.clearVersion('LOAN-123')

      expect(store.getVersionInfo('LOAN-123')).toBeUndefined()
      expect(store.getVersionInfo('LOAN-456')).toBeDefined()
    })

    it('should handle clearing non-existent account gracefully', () => {
      const store = useVersionStore.getState()

      expect(() => store.clearVersion('LOAN-UNKNOWN')).not.toThrow()
    })
  })

  describe('clearAllVersions', () => {
    it('should remove all tracked versions', () => {
      const store = useVersionStore.getState()

      store.setVersion('LOAN-123', '2025-12-11T06:00:00.000Z', 'doc-abc')
      store.setVersion('LOAN-456', '2025-12-11T07:00:00.000Z', 'doc-def')

      store.clearAllVersions()

      expect(store.getVersionInfo('LOAN-123')).toBeUndefined()
      expect(store.getVersionInfo('LOAN-456')).toBeUndefined()
    })
  })

  describe('hasVersion', () => {
    it('should return true for tracked account', () => {
      const store = useVersionStore.getState()

      store.setVersion('LOAN-123', '2025-12-11T06:00:00.000Z', 'doc-abc')

      expect(store.hasVersion('LOAN-123')).toBe(true)
    })

    it('should return false for untracked account', () => {
      const store = useVersionStore.getState()

      expect(store.hasVersion('LOAN-UNKNOWN')).toBe(false)
    })

    it('should return false after clearing', () => {
      const store = useVersionStore.getState()

      store.setVersion('LOAN-123', '2025-12-11T06:00:00.000Z', 'doc-abc')
      store.clearVersion('LOAN-123')

      expect(store.hasVersion('LOAN-123')).toBe(false)
    })
  })

  describe('loadedAt timestamp', () => {
    it('should set loadedAt to current time when setting version', () => {
      const beforeTime = new Date().toISOString()
      const store = useVersionStore.getState()

      store.setVersion('LOAN-123', '2025-12-11T06:00:00.000Z', 'doc-abc')

      const afterTime = new Date().toISOString()
      const version = store.getVersionInfo('LOAN-123')

      expect(version?.loadedAt).toBeDefined()
      expect(version!.loadedAt >= beforeTime).toBe(true)
      expect(version!.loadedAt <= afterTime).toBe(true)
    })
  })
})
