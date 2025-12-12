# Component Inventory: Billie CRM Web

## Overview

The application utilizes **Payload CMS 3.0** UI components augmented with custom React components for the "Servicing" tab in the Admin panel.

## Loan Account Servicing Components
Located in `src/components/LoanAccountServicing/`. This module provides the "Servicing" view for Loan Accounts.

### Main Views
| Component | File | Description |
|-----------|------|-------------|
| **LoanAccountServicing** | `index.tsx` | Main container. Fetches account context, displays balance, actions, and transaction list. |

### Sub-Components
| Component | File | Description |
|-----------|------|-------------|
| **BalanceCard** | `BalanceCard.tsx` | Displays live balances (Principal, Fees, Total). Handles fallback when Ledger is offline. |
| **TransactionList** | `TransactionList.tsx` | Data table for transaction history. Supports filtering by type and pagination. |

### Action Modals
| Component | File | Action |
|-----------|------|--------|
| **RecordPaymentModal** | `RecordPaymentModal.tsx` | `POST /api/ledger/repayment`. Records manual payments. |
| **ApplyLateFeeModal** | `ApplyLateFeeModal.tsx` | `POST /api/ledger/late-fee`. Applies fees for overdue accounts. |
| **WaiveFeeModal** | `WaiveFeeModal.tsx` | `POST /api/ledger/waive-fee`. Waives existing fees (requires approval). |
| **AdjustmentModal** | `AdjustmentModal.tsx` | `POST /api/ledger/adjustment`. Manual debit/credit corrections. |
| **WriteOffModal** | `WriteOffModal.tsx` | `POST /api/ledger/write-off`. Writes off bad debt (requires "WRITE OFF" confirmation). |

## Payload CMS Views
The application uses default Payload views for most collections, customized via `payload.config.ts`:
-   **Customers**: Standard List/Edit view.
-   **LoanAccounts**: Custom "Servicing" tab injected via `components.views.edit`.
-   **Conversations**: Standard List/Edit view.
-   **Applications**: Standard List/Edit view.

## Styling
-   **CSS Modules**: Used for custom components (`styles.module.css`).
-   **Payload Design System**: Reuses Payload's CSS variables and base styles where possible.
