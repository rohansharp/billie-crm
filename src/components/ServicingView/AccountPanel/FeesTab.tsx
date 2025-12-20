'use client'

import { FeeList, type SelectedFee } from '../FeeList'
import styles from './styles.module.css'

export interface FeesTabProps {
  loanAccountId: string
  onBulkWaive?: (fees: SelectedFee[]) => void
}

/**
 * FeesTab - Wrapper for FeeList in tab panel.
 */
export const FeesTab: React.FC<FeesTabProps> = ({ loanAccountId, onBulkWaive }) => {
  return (
    <div
      className={styles.tabPanel}
      role="tabpanel"
      id="tabpanel-fees"
      aria-labelledby="tab-fees"
      data-testid="fees-tab"
    >
      <FeeList loanAccountId={loanAccountId} onBulkWaive={onBulkWaive} />
    </div>
  )
}
