'use client'

import { QueryClientProvider } from './query-client'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'sonner'

export const Providers: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <QueryClientProvider>
      {children}
      <Toaster position="top-right" richColors />
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}

// Default export is required for Payload's provider registration (import map expects '@/providers#default').
export default Providers
