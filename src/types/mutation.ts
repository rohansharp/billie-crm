export type MutationStage = 'optimistic' | 'submitted' | 'confirmed' | 'failed'

export interface PendingMutation {
  id: string
  accountId: string
  action: string
  stage: MutationStage
  amount?: number
  createdAt: number
  error?: string
}
