'use client'

import { QueryClientProvider } from './query-client'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'sonner'
import { CommandPalette } from '@/components/ui/CommandPalette'
import { useUIStore } from '@/stores/ui'
import { useCommandPaletteHotkeys } from '@/hooks/useGlobalHotkeys'

/**
 * Global command palette wrapper that connects to UI store.
 * Registered inside Providers to appear on all Payload admin pages.
 */
const GlobalCommandPalette: React.FC = () => {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    commandPaletteQuery,
    setCommandPaletteQuery,
  } = useUIStore()

  // Register global hotkeys (Cmd+K, Ctrl+K, F7, Escape)
  useCommandPaletteHotkeys(commandPaletteOpen, setCommandPaletteOpen)

  return (
    <CommandPalette
      isOpen={commandPaletteOpen}
      onOpenChange={setCommandPaletteOpen}
      query={commandPaletteQuery}
      onQueryChange={setCommandPaletteQuery}
      isSearching={false} // Story 1.3 will wire this to actual search state
    >
      {/* Story 1.3 will inject search results here */}
    </CommandPalette>
  )
}

export const Providers: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <QueryClientProvider>
      {children}
      <Toaster position="top-right" richColors />
      <GlobalCommandPalette />
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}

// Default export is required for Payload's provider registration (import map expects '@/providers#default').
export default Providers
