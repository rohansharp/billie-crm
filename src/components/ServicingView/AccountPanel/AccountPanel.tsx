'use client'

import { useMemo } from 'react'
import type { LoanAccountData } from '@/hooks/queries/useCustomer'
import type { SelectedFee } from '../FeeList'
import { AccountHeader } from './AccountHeader'
import { AccountTabs, type TabId } from './AccountTabs'
import { AccountSwitcher } from './AccountSwitcher'
import { OverviewTab } from './OverviewTab'
import { TransactionsTab } from './TransactionsTab'
import { FeesTab } from './FeesTab'
import { ActionsTab } from './ActionsTab'
import styles from './styles.module.css'

export interface AccountPanelProps {
  account: LoanAccountData
  allAccounts: LoanAccountData[]
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  onClose: () => void
  onSwitchAccount: (accountId: string) => void
  onWaiveFee: () => void
  onRecordRepayment: () => void
  onBulkWaive: (fees: SelectedFee[]) => void
}

/**
 * AccountPanel - Main container for account details with tabbed navigation.
 * Replaces the drawer-based approach with an inline panel.
 */
export const AccountPanel: React.FC<AccountPanelProps> = ({
  account,
  allAccounts,
  activeTab,
  onTabChange,
  onClose,
  onSwitchAccount,
  onWaiveFee,
  onRecordRepayment,
  onBulkWaive,
}) => {
  // Other accounts for switcher (exclude current)
  const otherAccounts = useMemo(
    () => allAccounts.filter((a) => a.loanAccountId !== account.loanAccountId),
    [allAccounts, account.loanAccountId]
  )

  // Show close button only if there are multiple accounts
  const showClose = allAccounts.length > 1

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab account={account} />
      case 'transactions':
        return <TransactionsTab loanAccountId={account.loanAccountId} />
      case 'fees':
        return <FeesTab loanAccountId={account.loanAccountId} onBulkWaive={onBulkWaive} />
      case 'actions':
        return (
          <ActionsTab
            account={account}
            onRecordRepayment={onRecordRepayment}
            onWaiveFee={onWaiveFee}
          />
        )
      default:
        return <OverviewTab account={account} />
    }
  }

  return (
    <div className={styles.accountPanel} data-testid="account-panel">
      <AccountHeader account={account} onClose={onClose} showClose={showClose} />
      <AccountTabs activeTab={activeTab} onTabChange={onTabChange} />
      <div className={styles.accountPanelContent}>{renderTabContent()}</div>
      {otherAccounts.length > 0 && (
        <AccountSwitcher accounts={otherAccounts} onSelect={onSwitchAccount} />
      )}
    </div>
  )
}
