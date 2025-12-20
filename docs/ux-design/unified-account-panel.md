# Unified Account Panel - UX Implementation

**Author:** Sally (UX Designer)  
**Date:** 11 Dec 2025  
**Status:** ✅ Implemented (Phase 1 + Phase 2)

---

## 1. Executive Summary

Transformed the ServicingView from a drawer-based detail view to a unified account panel with tabs. This eliminates the UX friction where the account details drawer obstructed transaction history and created context loss when closed.

### Key Benefits Achieved
- ✅ **No occlusion** - All content visible, no overlays blocking main view
- ✅ **Clear context** - Always know which account you're viewing
- ✅ **Quick access** - Tabs for instant navigation between aspects
- ✅ **Seamless switching** - Mini-cards for quick account changes
- ✅ **Familiar pattern** - Tabs are universally understood
- ✅ **Keyboard-first** - Full keyboard navigation support

---

## 2. Final Implementation

### Component Structure
```
src/components/ServicingView/AccountPanel/
├── AccountPanel.tsx           # Main panel container with keyboard shortcuts
├── AccountHeader.tsx          # 📍 Account info bar with status + close
├── AccountTabs.tsx            # Tab navigation with keyboard hints + badges
├── AccountSwitcher.tsx        # Mini-cards for quick account switching
├── OverviewTab.tsx            # Balance, terms, schedule, last payment
├── TransactionsTab.tsx        # Wraps existing TransactionHistory
├── FeesTab.tsx                # Wraps existing FeeList with bulk waive
├── ActionsTab.tsx             # Record Payment, Waive Fee action cards
├── useAccountPanelHotkeys.ts  # Custom hook for keyboard shortcuts
├── styles.module.css          # Component-specific styles
└── index.ts                   # Barrel exports

src/hooks/queries/
└── useFeesCount.ts            # Hook for fees badge count
```

### Information Architecture

**Overview State (No Account Selected)**
```
┌─────────────────────────────────────────────────────────────┐
│ Customer Servicing > Customer Name                           │
├──────────────┬──────────────────────────────────────────────┤
│              │                                               │
│  Customer    │  Loan Accounts (N)         Total: $X,XXX.XX  │
│  Profile     │  ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│              │  │ Account1 │ │ Account2 │ │ Account3 │      │
│              │  │ ✓ Active │ │  Closed  │ │  Arrears │      │
│              │  │ $XXX.XX  │ │ $XXX.XX  │ │ $XXX.XX  │      │
│              │  └──────────┘ └──────────┘ └──────────┘      │
│              │                                               │
│              │  ┌─────────────────────────────────────────┐ │
│              │  │           👆 Select an Account          │ │
│              │  │  Click on a loan account above to view  │ │
│              │  │  details, transactions, and take actions│ │
│              │  │                                         │ │
│              │  │  Use 1-4 to switch tabs, ↑↓ to navigate│ │
│              │  └─────────────────────────────────────────┘ │
└──────────────┴──────────────────────────────────────────────┘
```

**Account Selected State**
```
┌─────────────────────────────────────────────────────────────┐
│ Customer Servicing > Customer Name                           │
├──────────────┬──────────────────────────────────────────────┤
│              │ ┌───────────────────────────────────────────┐│
│  Customer    │ │📍 0WOMN8STJBKY │ Active │ Live │ $83 [✕] ││
│  Profile     │ └───────────────────────────────────────────┘│
│              │                                               │
│              │ ┌─────────┬──────────────┬────────┬─────────┐│
│              │ │Overview │ Transactions │ Fees ⓷ │ Actions ││
│              │ │   [1]   │     [2]      │  [3]   │   [4]   ││
│              │ └─────────┴──────────────┴────────┴─────────┘│
│              │ ═══════════════════════════════════════════  │
│              │                                               │
│              │  [Active Tab Content]                         │
│              │                                               │
│              │ ─────────────────────────────────────────────│
│              │ Other Accounts:                               │
│              │ ┌─────────────┐ ┌─────────────┐              │
│              │ │ 0ABC123...  │ │ 0XYZ789...  │ ← ↑↓ to nav  │
│              │ │ Closed • $0 │ │ Active $200 │              │
│              │ └─────────────┘ └─────────────┘              │
└──────────────┴──────────────────────────────────────────────┘
```

---

## 3. Keyboard Shortcuts

| Shortcut | Action | Scope |
|----------|--------|-------|
| `1` | Switch to Overview tab | When account selected |
| `2` | Switch to Transactions tab | When account selected |
| `3` | Switch to Fees tab | When account selected |
| `4` | Switch to Actions tab | When account selected |
| `↑` | Navigate to previous account | When multiple accounts |
| `↓` | Navigate to next account | When multiple accounts |
| `←` / `→` | Navigate tabs when tab focused | Within tab navigation |
| `Escape` | Close account panel | When account selected |

**Note:** Shortcuts are disabled when:
- Modifier keys (Cmd/Ctrl/Alt) are pressed
- User is typing in an input, textarea, or select
- Panel is not active

---

## 4. Tab Content

### Overview Tab (1)
- Account number and Loan Account ID
- Live/Cached balance indicator
- Balance breakdown: Principal, Fees, Total Outstanding, Total Paid
- Loan Terms: Amount, Fee, Total Payable, Opened Date
- Repayment Schedule: Frequency, Number of Payments
- Last Payment: Date, Amount

### Transactions Tab (2)
- Full transaction history with filtering
- Type filter dropdown
- Date range filters (From/To)
- Paginated results with "Load More"
- Mobile-responsive card view

### Fees Tab (3)
- List of waivable fees (Late Fee, Dishonour Fee)
- Selection mode for bulk operations
- Select All / Clear actions
- Fee count badge on tab
- Bulk waive functionality

### Actions Tab (4)
- **Record Payment** - Action card with outstanding balance
- **Waive Fee** - Action card with current fee balance
- Read-only mode warning when applicable
- Pending action indicators
- Future actions placeholder

---

## 5. Multi-Account Behavior

| Scenario | Behavior |
|----------|----------|
| **1 account** | Auto-selected on load, no close button |
| **2+ accounts** | Show card grid, require selection, show total |
| **Account selected** | Tabbed panel + "Other Accounts" switcher at bottom |
| **Switch account** | Click mini-card or use ↑↓ keys, tab resets to Overview |
| **Close (✕)** | Return to card grid, clear selection |

### Account Card Visual States
- **Default**: White background, subtle border
- **Selected**: Green border + background, "✓ Selected" hint
- **Hover**: Darker border, subtle shadow

---

## 6. State Management

```typescript
// ServicingView.tsx
const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
const [activeTab, setActiveTab] = useState<TabId>('overview')

// Derived account from accounts array
const selectedAccount = useMemo(() => 
  accounts.find(a => a.loanAccountId === selectedAccountId) ?? null,
  [accounts, selectedAccountId]
)

// Get fees count for badge
const feesCount = useFeesCount(selectedAccountId)

// Auto-select single account
useEffect(() => {
  if (accounts.length === 1 && !selectedAccountId) {
    setSelectedAccountId(accounts[0].loanAccountId)
  }
}, [accounts, selectedAccountId])
```

---

## 7. Test Coverage

### New Unit Tests (42 tests added)

**useAccountPanelHotkeys.test.ts** (17 tests)
- Tab switching with number keys 1-4
- Out-of-range keys (0, 5) ignored
- Arrow key account navigation with wrap-around
- Single account ignores arrow keys
- Escape key closes panel
- Modifier keys disable shortcuts
- isActive flag controls all shortcuts
- Input element handling (ignores when typing)
- Cleanup on unmount

**account-tabs.test.tsx** (25 tests)
- Renders all four tabs
- Shows/hides keyboard hints
- Active tab state and aria attributes
- Tab click handlers
- Arrow key navigation within tabs
- Fees badge display
- Accessibility: tablist role, aria-controls

---

## 8. Success Metrics

| Metric | Before | After |
|--------|--------|-------|
| Clicks to view transactions | 1 (blocks view) | 1 (tab switch) |
| Context loss on close | 100% | 0% |
| Actions discoverable | Hidden in drawer | Always visible in tab |
| Account comparison | Impossible | Quick via total + cards |
| Keyboard navigation | None | Full support |

---

## 9. Future Enhancements

### Completed ✅
- [x] Keyboard shortcuts (1-4, ↑↓, Escape)
- [x] Tab badges (fees count)
- [x] Keyboard hints on tabs
- [x] Account total across all accounts

### Planned
- [ ] **Deep linking** - URL reflects selected account/tab
- [ ] **Transaction count badge** - Show count on Transactions tab
- [ ] **Collapsible sections** - Overview sections can collapse
- [ ] **User preferences** - Remember last selected tab
- [ ] **Animations** - Smooth tab transitions

---

## 10. Files Changed

### New Files
- `src/components/ServicingView/AccountPanel/AccountPanel.tsx`
- `src/components/ServicingView/AccountPanel/AccountHeader.tsx`
- `src/components/ServicingView/AccountPanel/AccountTabs.tsx`
- `src/components/ServicingView/AccountPanel/AccountSwitcher.tsx`
- `src/components/ServicingView/AccountPanel/OverviewTab.tsx`
- `src/components/ServicingView/AccountPanel/TransactionsTab.tsx`
- `src/components/ServicingView/AccountPanel/FeesTab.tsx`
- `src/components/ServicingView/AccountPanel/ActionsTab.tsx`
- `src/components/ServicingView/AccountPanel/useAccountPanelHotkeys.ts`
- `src/components/ServicingView/AccountPanel/styles.module.css`
- `src/components/ServicingView/AccountPanel/index.ts`
- `src/hooks/queries/useFeesCount.ts`
- `tests/unit/hooks/useAccountPanelHotkeys.test.ts`
- `tests/unit/ui/account-tabs.test.tsx`

### Modified Files
- `src/components/ServicingView/ServicingView.tsx` - Major refactor
- `src/components/ServicingView/LoanAccountCard.tsx` - Added isSelected prop
- `src/components/ServicingView/styles.module.css` - Selection prompt, card selected state

### Preserved (No Changes)
- `src/components/ServicingView/CustomerProfile.tsx`
- `src/components/ServicingView/TransactionHistory.tsx`
- `src/components/ServicingView/FeeList.tsx`
- `src/components/ServicingView/WaiveFeeDrawer.tsx`
- `src/components/ServicingView/RecordRepaymentDrawer.tsx`
- `src/components/ServicingView/BulkWaiveFeeDrawer.tsx`

---

*Sarah can now view transactions, check fees, and take actions without losing context. Her productivity just got a boost!* 🎨✨
