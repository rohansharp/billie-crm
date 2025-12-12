'use client'

import { create } from 'zustand'

interface UIState {
  readOnlyMode: boolean
  setReadOnlyMode: (value: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  readOnlyMode: false,
  setReadOnlyMode: (value) => set({ readOnlyMode: value }),
}))
