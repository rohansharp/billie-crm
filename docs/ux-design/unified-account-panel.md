# Unified Account Panel - UX Implementation Plan

**Author:** Sally (UX Designer)  
**Date:** 11 Dec 2025  
**Status:** Approved for Implementation

---

## 1. Executive Summary

Transform the ServicingView from a drawer-based detail view to a unified account panel with tabs. This eliminates the UX friction where the account details drawer obstructs transaction history and creates context loss when closed.

### Key Benefits
- **No occlusion** - All content visible, no overlays
- **Clear context** - Always know which account you're viewing
- **Quick access** - Tabs for instant navigation between aspects
- **Seamless switching** - Mini-cards for quick account changes
- **Familiar pattern** - Tabs are universally understood

---

## 2. Information Architecture

### Overview State (No Account Selected)
```
┌─────────────────────────────────────────────────────────────┐
│ Customer Servicing > Customer Name                           │
├──────────────┬──────────────────────────────────────────────┤
│              │                                               │
│  Customer    │  Loan Accounts (N)         Total: $X,XXX.XX  │
│  Profile     │  ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│              │  │ Account1 │ │ Account2 │ │ Account3 │      │
│              │  │ Status   │ │ Status   │ │ Status   │      │
│              │  │ $XXX.XX  │ │ $XXX.XX  │ │ $XXX.XX  │      │
│              │  └──────────┘ └──────────┘ └──────────┘      │
│              │                                               │
│              │  ─────────────────────────────────────────── │
│              │  Select an account above to view details,    │
│              │  transactions, and take actions.             │
│              │                                               │
└──────────────┴──────────────────────────────────────────────┘
```

### Account Selected State
```
┌─────────────────────────────────────────────────────────────┐
│ Customer Servicing > Customer Name                           │
├──────────────┬──────────────────────────────────────────────┤
│              │ ┌───────────────────────────────────────────┐│
│  Customer    │ │ 📍 AccountNum │ Status │ $XXX.XX  [✕]    ││
│  Profile     │ └───────────────────────────────────────────┘│
│              │                                               │
│              │ ┌────────┬──────────────┬──────┬─────────┐   │
│              │ │Overview│ Transactions │ Fees │ Actions │   │
│              │ └────────┴──────────────┴──────┴─────────┘   │
│              │ ═══════════════════════════════════════════  │
│              │                                               │
│              │  [Active Tab Content]                         │
│              │                                               │
│              │ ─────────────────────────────────────────────│
│              │ Other Accounts:                               │
│              │ ┌─────────────┐ ┌─────────────┐              │
│              │ │ Account2    │ │ Account3    │              │
│              │ └─────────────┘ └─────────────┘              │
└──────────────┴──────────────────────────────────────────────┘
```

---

## 3. Component Architecture

### New Components
```
src/components/ServicingView/
├── AccountPanel/
│   ├── AccountPanel.tsx           # Main panel container
│   ├── AccountHeader.tsx          # Account info + close button
│   ├── AccountTabs.tsx            # Tab navigation
│   ├── AccountSwitcher.tsx        # Mini-cards for switching
│   └── index.ts                   # Barrel exports
├── tabs/
│   ├── OverviewTab.tsx            # Balance details (refactored from LoanAccountDetails)
│   ├── TransactionsTab.tsx        # Wrapper for TransactionHistory
│   ├── FeesTab.tsx                # Wrapper for FeeList
│   └── ActionsTab.tsx             # Actions (Waive Fee, Record Payment)
└── ... existing components
```

### Modified Components
- `ServicingView.tsx` - Major refactor to use new AccountPanel
- `LoanAccountCard.tsx` - Add compact mode for switcher
- `LoanAccountDetails.tsx` - Extract balance section for OverviewTab

### Unchanged Components
- `CustomerProfile.tsx`
- `TransactionHistory.tsx` (content only, wrapped by tab)
- `FeeList.tsx` (content only, wrapped by tab)
- `WaiveFeeDrawer.tsx`
- `RecordRepaymentDrawer.tsx`
- `BulkWaiveFeeDrawer.tsx`

---

## 4. State Management

### Current State
```typescript
// ServicingView.tsx
const [selectedAccount, setSelectedAccount] = useState<LoanAccountData | null>(null)
```

### New State
```typescript
// ServicingView.tsx
const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
const [activeTab, setActiveTab] = useState<TabId>('overview')

// Derived
const selectedAccount = useMemo(() => 
  accounts.find(a => a.loanAccountId === selectedAccountId) ?? null,
  [accounts, selectedAccountId]
)

// Auto-select single account
useEffect(() => {
  if (accounts.length === 1 && !selectedAccountId) {
    setSelectedAccountId(accounts[0].loanAccountId)
  }
}, [accounts, selectedAccountId])
```

### Tab IDs
```typescript
type TabId = 'overview' | 'transactions' | 'fees' | 'actions'
```

---

## 5. Component Specifications

### AccountPanel
```typescript
interface AccountPanelProps {
  account: LoanAccountData
  allAccounts: LoanAccountData[]
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  onClose: () => void
  onSwitchAccount: (accountId: string) => void
  // Action handlers
  onWaiveFee: () => void
  onRecordRepayment: () => void
  onBulkWaive: (fees: SelectedFee[]) => void
}
```

### AccountHeader
```typescript
interface AccountHeaderProps {
  account: LoanAccountData
  onClose: () => void
  showClose?: boolean  // False for single-account customers
}

// Renders:
// ┌─────────────────────────────────────────────────────┐
// │ 📍 0WOMN8STJBKY │ Active │ Live │ $83.00    [✕]    │
// └─────────────────────────────────────────────────────┘
```

### AccountTabs
```typescript
interface AccountTabsProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  feesCount?: number      // Badge for fees tab
  hasPendingAction?: boolean  // Indicator for actions tab
}

// Tab configuration
const TABS: { id: TabId; label: string; icon?: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'fees', label: 'Fees' },
  { id: 'actions', label: 'Actions' },
]
```

### AccountSwitcher
```typescript
interface AccountSwitcherProps {
  accounts: LoanAccountData[]  // Excludes currently selected
  onSelect: (accountId: string) => void
}

// Renders mini-cards in horizontal scrollable strip
```

---

## 6. Tab Content Definitions

### Overview Tab
Content from current `LoanAccountDetails.tsx` minus the action buttons:
- Account number and status badge
- Live/Cached balance indicator
- Balance breakdown (Principal, Fees, Total Outstanding, Total Paid)
- Loan Terms section
- Repayment Schedule section
- Last Payment section

### Transactions Tab
Wrapper around existing `TransactionHistory` component:
```tsx
<TransactionHistory loanAccountId={account.loanAccountId} />
```

### Fees Tab
Wrapper around existing `FeeList` component:
```tsx
<FeeList 
  loanAccountId={account.loanAccountId} 
  onBulkWaive={onBulkWaive} 
/>
```

### Actions Tab
Dedicated action buttons with descriptions:
```
┌─────────────────────────────────────────────────────────────┐
│ Available Actions                                            │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 💳 Record Payment                                       │ │
│ │ Record a manual repayment for this account             │ │
│ │                                        [Record Payment] │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🎁 Waive Fee                                            │ │
│ │ Waive outstanding fees for this account                │ │
│ │ Current fees: $30.00                   [Waive Fee]     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ [Future: Write-Off, Reschedule, etc.]                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. CSS Styling Strategy

### New CSS Classes
```css
/* Account Panel */
.accountPanel { ... }
.accountPanelHeader { ... }
.accountPanelContent { ... }

/* Account Header Bar */
.accountHeaderBar { ... }
.accountHeaderInfo { ... }
.accountHeaderIcon { ... }  /* 📍 pin icon */
.accountHeaderNumber { ... }
.accountHeaderStatus { ... }
.accountHeaderBalance { ... }
.accountHeaderClose { ... }

/* Tabs */
.tabNav { ... }
.tabNavList { ... }
.tabNavItem { ... }
.tabNavItemActive { ... }
.tabNavBadge { ... }
.tabContent { ... }

/* Account Switcher */
.accountSwitcher { ... }
.accountSwitcherTitle { ... }
.accountSwitcherList { ... }
.accountSwitcherCard { ... }  /* Compact version of accountCard */

/* Overview State */
.overviewPlaceholder { ... }
.overviewTotalBanner { ... }
```

### Responsive Breakpoints
- **Desktop (≥1024px):** Full layout with sidebar
- **Tablet (768-1023px):** Collapsible sidebar, full tabs
- **Mobile (<768px):** Stacked layout, horizontal scrolling tabs

---

## 8. Phased Implementation Plan

### Phase 1: Foundation (MVP) - ~2-3 hours
**Goal:** Basic tab navigation without breaking existing functionality

1. **Create AccountPanel component structure**
   - Shell component with header and tab navigation
   - Tab content renders existing components

2. **Create AccountTabs component**
   - Tab navigation UI
   - Active tab state

3. **Create AccountHeader component**
   - Account info display
   - Close button

4. **Integrate into ServicingView**
   - Replace drawer with AccountPanel
   - Add activeTab state
   - Wire up tab switching

5. **Remove ContextDrawer** (for account details only)
   - Keep WaiveFeeDrawer, RecordRepaymentDrawer, BulkWaiveFeeDrawer as overlays

### Phase 2: Polish - ~1-2 hours
**Goal:** Complete UX with multi-account support

1. **Create AccountSwitcher component**
   - Mini-card display
   - Account switching

2. **Enhance LoanAccountCard**
   - Add `variant="compact"` prop for switcher

3. **Auto-select single account**
   - useEffect to auto-select when only one account

4. **Add total across accounts**
   - Calculate and display in accounts section header

### Phase 3: Refinement - ~1 hour
**Goal:** Accessibility and edge cases

1. **Keyboard navigation**
   - Arrow keys for tab navigation
   - Focus management

2. **ARIA attributes**
   - role="tablist", role="tab", role="tabpanel"
   - aria-selected, aria-controls

3. **Animations**
   - Tab transition effects
   - Smooth content switching

4. **Mobile optimizations**
   - Swipe gestures for tabs
   - Touch-friendly targets

---

## 9. Testing Strategy

### Unit Tests
- AccountPanel renders with all tabs
- Tab switching updates content
- AccountHeader displays correct info
- AccountSwitcher shows other accounts
- Close button clears selection

### Integration Tests
- Selecting account shows panel
- Switching accounts preserves tab
- Actions work from Actions tab
- Bulk waive works from Fees tab

### Accessibility Tests
- Screen reader navigation
- Keyboard-only operation
- Focus management

---

## 10. Migration Notes

### Breaking Changes
- `ContextDrawer` no longer used for account details
- `selectedAccount` state semantics change

### Preserved Behavior
- WaiveFeeDrawer, RecordRepaymentDrawer, BulkWaiveFeeDrawer remain as overlays
- All existing functionality continues to work
- Transaction filtering preserved
- Fee selection mode preserved

### Rollback Plan
- Keep old ServicingView in `ServicingView.backup.tsx` during development
- Feature flag option: `USE_ACCOUNT_PANEL=true`

---

## 11. Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Clicks to view transactions | 1 (opens drawer that blocks) | 1 (tab switch) |
| Context loss on drawer close | 100% (data disappears) | 0% (data persists) |
| Actions visible | Only in drawer | Always in Actions tab |
| Account comparison | Impossible | Quick via mini-cards |

---

## 12. Future Enhancements

1. **Keyboard shortcuts**
   - `1-4` keys to switch tabs
   - `Esc` to close panel
   - `↑↓` to switch accounts

2. **Deep linking**
   - URL reflects selected account and tab
   - `/customer/:id/account/:accountId/transactions`

3. **Tab badges**
   - Transaction count on Transactions tab
   - Pending fee count on Fees tab
   - Pending action indicator on Actions tab

4. **Collapsible sections**
   - Overview tab sections can collapse
   - User preference remembered

---

*Ready to build? Let's make Sarah's day easier.* 🎨
