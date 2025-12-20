'use client'

import { TransactionHistory } from '../TransactionHistory'
import styles from './styles.module.css'

export interface TransactionsTabProps {
  loanAccountId: string
}

/**
 * TransactionsTab - Wrapper for TransactionHistory in tab panel.
 */
export const TransactionsTab: React.FC<TransactionsTabProps> = ({ loanAccountId }) => {
  return (
    <div
      className={styles.tabPanel}
      role="tabpanel"
      id="tabpanel-transactions"
      aria-labelledby="tab-transactions"
      data-testid="transactions-tab"
    >
      <TransactionHistory loanAccountId={loanAccountId} />
    </div>
  )
}
