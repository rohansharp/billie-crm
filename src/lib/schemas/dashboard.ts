import { z } from 'zod'

/**
 * Dashboard API response schema.
 *
 * Used by:
 * - GET /api/dashboard route for response validation
 * - useDashboard hook for type safety
 *
 * Story 6.2: Dashboard Home Page
 */
export const DashboardResponseSchema = z.object({
  user: z.object({
    firstName: z.string(),
    role: z.enum(['admin', 'supervisor', 'operations', 'readonly']),
  }),
  actionItems: z.object({
    pendingApprovalsCount: z.number().int().min(0),
    failedActionsCount: z.number().int().min(0),
  }),
  recentCustomersSummary: z.array(
    z.object({
      customerId: z.string(),
      name: z.string(),
      accountCount: z.number().int().min(0),
      totalOutstanding: z.string(),
    }),
  ),
  systemStatus: z.object({
    ledger: z.enum(['online', 'degraded', 'offline']),
    latencyMs: z.number().int().min(0),
    lastChecked: z.string().datetime(),
  }),
})

export type DashboardResponse = z.infer<typeof DashboardResponseSchema>

/**
 * Query params for dashboard API.
 */
export const DashboardQuerySchema = z.object({
  recentCustomerIds: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',').filter(Boolean).slice(0, 10) : [])),
})

export type DashboardQuery = z.infer<typeof DashboardQuerySchema>
