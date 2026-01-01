/**
 * gRPC Client for AccountingLedgerService
 *
 * Provides typed interfaces for interacting with the ledger service.
 */

import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load proto file
const PROTO_PATH = path.resolve(__dirname, '../../proto/accounting_ledger.proto')

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
})

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any
const AccountingLedgerService = protoDescriptor.billie.ledger.v1.AccountingLedgerService

// =============================================================================
// Types
// =============================================================================

export enum TransactionType {
  TRANSACTION_TYPE_UNSPECIFIED = 'TRANSACTION_TYPE_UNSPECIFIED',
  DISBURSEMENT = 'DISBURSEMENT',
  ESTABLISHMENT_FEE = 'ESTABLISHMENT_FEE',
  REPAYMENT = 'REPAYMENT',
  LATE_FEE = 'LATE_FEE',
  DISHONOUR_FEE = 'DISHONOUR_FEE',
  FEE_WAIVER = 'FEE_WAIVER',
  ADJUSTMENT = 'ADJUSTMENT',
  WRITE_OFF = 'WRITE_OFF',
}

export interface Transaction {
  transactionId: string
  loanAccountId: string
  type: TransactionType
  transactionDate: { seconds: string; nanos: number }
  effectiveDate: string
  principalDelta: string
  feeDelta: string
  principalAfter: string
  feeAfter: string
  totalDelta: string
  totalAfter: string
  description: string
  referenceType: string
  referenceId: string
  metadata: Record<string, string>
  createdBy: string
  createdAt: { seconds: string; nanos: number }
  portfolioEntryId: string
}

export interface GetTransactionsRequest {
  loanAccountId: string
  limit?: number
  fromDate?: string
  toDate?: string
  typeFilter?: TransactionType
}

export interface GetTransactionsResponse {
  loanAccountId: string
  transactions: Transaction[]
  totalCount: number
}

export interface GetBalanceRequest {
  loanAccountId: string
}

export interface GetBalanceResponse {
  loanAccountId: string
  principalBalance: string
  feeBalance: string
  totalOutstanding: string
  asOf: { seconds: string; nanos: number }
}

export interface GetLedgerRecordRequest {
  loanAccountId: string
}

export interface LedgerRecordResponse {
  loanAccountId: string
  accountNumber: string
  customerId: string
  applicationNumber: string
  disbursedPrincipal: string
  establishmentFee: string
  totalRepayable: string
  principalBalance: string
  feeBalance: string
  totalOutstanding: string
  totalPaid: string
  transactionCount: number
  lastTransactionId?: string
  scheduleId?: string
  createdAt: { seconds: string; nanos: number }
  updatedAt: { seconds: string; nanos: number }
}

export interface GetStatementRequest {
  loanAccountId: string
  periodStart: string
  periodEnd: string
}

export interface StatementLine {
  date: string
  transactionId: string
  description: string
  charge?: string
  payment?: string
  balance: string
}

export interface StatementResponse {
  loanAccountId: string
  accountNumber: string
  customerId: string
  periodStart: string
  periodEnd: string
  disbursedPrincipal: string
  establishmentFee: string
  totalRepayable: string
  openingBalance: string
  feesCharged: string
  paymentsReceived: string
  closingBalance: string
  lines: StatementLine[]
  generatedAt: { seconds: string; nanos: number }
}

export interface RecordRepaymentRequest {
  loanAccountId: string
  amount: string
  paymentId?: string
  paymentMethod?: string
  paymentReference?: string
  notes?: string
  idempotencyKey?: string
}

export interface ApplyLateFeeRequest {
  loanAccountId: string
  feeAmount: string
  daysPastDue: number
  reason?: string
  idempotencyKey?: string
}

export interface WaiveFeeRequest {
  loanAccountId: string
  waiverAmount: string
  reason: string
  approvedBy: string
  notes?: string
  idempotencyKey?: string
}

export interface WriteOffRequest {
  loanAccountId: string
  reason: string
  approvedBy: string
  idempotencyKey?: string
}

export interface MakeAdjustmentRequest {
  loanAccountId: string
  principalDelta: string
  feeDelta: string
  reason: string
  approvedBy: string
  idempotencyKey?: string
}

export interface TransactionResponse {
  transaction: Transaction
  eventId: string
  allocatedToFees?: string
  allocatedToPrincipal?: string
  overpayment?: string
  idempotentReplay?: boolean // True if this is a cached response from a previous request
}

// =============================================================================
// Client Class
// =============================================================================

export class LedgerClient {
  private client: any

  constructor(serviceUrl?: string) {
    const url = serviceUrl || process.env.LEDGER_SERVICE_URL || 'localhost:50051'
    this.client = new AccountingLedgerService(url, grpc.credentials.createInsecure())
  }

  // Helper to promisify gRPC calls
  private promisify<TRequest, TResponse>(
    method: (req: TRequest, callback: (err: any, res: TResponse) => void) => void,
  ): (req: TRequest) => Promise<TResponse> {
    return (request: TRequest) =>
      new Promise((resolve, reject) => {
        method.call(this.client, request, (err: any, response: TResponse) => {
          if (err) {
            reject(err)
          } else {
            resolve(response)
          }
        })
      })
  }

  // ===========================================================================
  // Read Operations
  // ===========================================================================

  async getTransactions(request: GetTransactionsRequest): Promise<GetTransactionsResponse> {
    return this.promisify<GetTransactionsRequest, GetTransactionsResponse>(
      this.client.getTransactions,
    )(request)
  }

  async getBalance(request: GetBalanceRequest): Promise<GetBalanceResponse> {
    return this.promisify<GetBalanceRequest, GetBalanceResponse>(this.client.getBalance)(request)
  }

  async getLedgerRecord(request: GetLedgerRecordRequest): Promise<LedgerRecordResponse> {
    return this.promisify<GetLedgerRecordRequest, LedgerRecordResponse>(this.client.getLedgerRecord)(
      request,
    )
  }

  async getStatement(request: GetStatementRequest): Promise<StatementResponse> {
    return this.promisify<GetStatementRequest, StatementResponse>(this.client.getStatement)(request)
  }

  // ===========================================================================
  // Write Operations
  // ===========================================================================

  async recordRepayment(request: RecordRepaymentRequest): Promise<TransactionResponse> {
    return this.promisify<RecordRepaymentRequest, TransactionResponse>(this.client.recordRepayment)(
      request,
    )
  }

  async applyLateFee(request: ApplyLateFeeRequest): Promise<TransactionResponse> {
    return this.promisify<ApplyLateFeeRequest, TransactionResponse>(this.client.applyLateFee)(
      request,
    )
  }

  async waiveFee(request: WaiveFeeRequest): Promise<TransactionResponse> {
    return this.promisify<WaiveFeeRequest, TransactionResponse>(this.client.waiveFee)(request)
  }

  async writeOff(request: WriteOffRequest): Promise<TransactionResponse> {
    return this.promisify<WriteOffRequest, TransactionResponse>(this.client.writeOff)(request)
  }

  async makeAdjustment(request: MakeAdjustmentRequest): Promise<TransactionResponse> {
    return this.promisify<MakeAdjustmentRequest, TransactionResponse>(this.client.makeAdjustment)(
      request,
    )
  }

  // ===========================================================================
  // Streaming
  // ===========================================================================

  watchTransactions(
    loanAccountId: string,
    onTransaction: (transaction: Transaction) => void,
    onError: (error: Error) => void,
    fromTransactionId?: string,
  ): { cancel: () => void } {
    const call = this.client.watchTransactions({
      loanAccountId,
      fromTransactionId,
    })

    call.on('data', (transaction: Transaction) => {
      onTransaction(transaction)
    })

    call.on('error', (error: Error) => {
      onError(error)
    })

    call.on('end', () => {
      // Stream ended
    })

    return {
      cancel: () => call.cancel(),
    }
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let ledgerClient: LedgerClient | null = null

export function getLedgerClient(): LedgerClient {
  if (!ledgerClient) {
    ledgerClient = new LedgerClient()
  }
  return ledgerClient
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Generate a unique idempotency key for gRPC requests.
 * 
 * Format: {prefix}-{timestamp}-{random}
 * - prefix: Operation type (e.g., "repay", "waive", "writeoff")
 * - timestamp: Current timestamp in base36
 * - random: Random alphanumeric suffix
 * 
 * These keys have a 24-hour TTL on the server side.
 */
export function generateIdempotencyKey(prefix: string): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  return `${prefix}-${timestamp}-${random}`
}

/**
 * Convert protobuf timestamp to JavaScript Date
 */
export function timestampToDate(timestamp: { seconds: string; nanos: number }): Date {
  const seconds = parseInt(timestamp.seconds, 10)
  const millis = Math.floor(timestamp.nanos / 1000000)
  return new Date(seconds * 1000 + millis)
}

/**
 * Format currency string for display
 */
export function formatCurrency(amount: string): string {
  const num = parseFloat(amount)
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(num)
}

/**
 * Map transaction type to display label
 */
export function getTransactionTypeLabel(type: TransactionType): string {
  const labels: Record<TransactionType, string> = {
    [TransactionType.TRANSACTION_TYPE_UNSPECIFIED]: 'Unknown',
    [TransactionType.DISBURSEMENT]: 'Disbursement',
    [TransactionType.ESTABLISHMENT_FEE]: 'Establishment Fee',
    [TransactionType.REPAYMENT]: 'Repayment',
    [TransactionType.LATE_FEE]: 'Late Fee',
    [TransactionType.DISHONOUR_FEE]: 'Dishonour Fee',
    [TransactionType.FEE_WAIVER]: 'Fee Waiver',
    [TransactionType.ADJUSTMENT]: 'Adjustment',
    [TransactionType.WRITE_OFF]: 'Write Off',
  }
  return labels[type] || 'Unknown'
}

