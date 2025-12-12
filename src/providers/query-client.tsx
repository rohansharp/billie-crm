'use client'

import {
  QueryClient,
  QueryClientProvider as TanStackProvider,
} from '@tanstack/react-query'
import { useState } from 'react'

export const QueryClientProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Create QueryClient inside useState to prevent hydration mismatch
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10_000,
            refetchOnWindowFocus: true,
            retry: 2,
          },
        },
      }),
  )

  return <TanStackProvider client={queryClient}>{children}</TanStackProvider>
}
