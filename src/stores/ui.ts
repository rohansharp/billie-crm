'use client'

import { create } from 'zustand'

interface UIState {
  // Read-only mode (Story 5.2)
  readOnlyMode: boolean
  setReadOnlyMode: (value: boolean) => void

  // Command palette state (Story 1.2)
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (value: boolean) => void
  commandPaletteQuery: string
  setCommandPaletteQuery: (value: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  // Read-only mode
  readOnlyMode: false,
  setReadOnlyMode: (value) => set({ readOnlyMode: value }),

  // Command palette
  commandPaletteOpen: false,
  // Reset query only when opening (not closing) to avoid flash of old query on reopen
  setCommandPaletteOpen: (value) => set((state) => ({
    commandPaletteOpen: value,
    commandPaletteQuery: value ? '' : state.commandPaletteQuery,
  })),
  commandPaletteQuery: '',
  setCommandPaletteQuery: (value) => set({ commandPaletteQuery: value }),
}))
