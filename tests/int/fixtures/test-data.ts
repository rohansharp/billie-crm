/**
 * Test fixtures for integration tests
 * Based on v2-servicing-app requirements
 */

// Customer test data (from customer.changed.v1 events)
export const testCustomers = {
  customer1: {
    customerId: 'TEST-CUS-001',
    firstName: 'John',
    lastName: 'Smith',
    fullName: 'John Smith',
    emailAddress: 'john.smith@test.billie.loans',
    mobilePhoneNumber: '0412345678',
    dateOfBirth: '1985-06-15',
    identityVerified: true,
    ekycStatus: 'successful',
    staffFlag: false,
    investorFlag: false,
    founderFlag: false,
    residentialAddress: {
      streetNumber: '123',
      streetName: 'Test',
      streetType: 'St',
      unitNumber: null,
      suburb: 'Sydney',
      state: 'NSW',
      postcode: '2000',
      country: 'Australia',
      fullAddress: '123 Test St, Sydney NSW 2000, Australia',
      street: '123 Test St',
      city: 'Sydney',
    },
  },
  customer2: {
    customerId: 'TEST-CUS-002',
    firstName: 'Jane',
    lastName: 'Doe',
    fullName: 'Jane Doe',
    emailAddress: 'jane.doe@test.billie.loans',
    mobilePhoneNumber: '0423456789',
    dateOfBirth: '1990-03-22',
    identityVerified: false,
    ekycStatus: 'pending',
    staffFlag: true,
    investorFlag: false,
    founderFlag: false,
    residentialAddress: {
      streetNumber: '456',
      streetName: 'Example',
      streetType: 'Ave',
      unitNumber: '5A',
      suburb: 'Melbourne',
      state: 'VIC',
      postcode: '3000',
      country: 'Australia',
      fullAddress: 'Unit 5A, 456 Example Ave, Melbourne VIC 3000, Australia',
      street: 'Unit 5A, 456 Example Ave',
      city: 'Melbourne',
    },
  },
}

// Loan account test data (from account.created.v1 events)
export const testLoanAccounts = {
  account1: {
    loanAccountId: 'TEST-ACC-001',
    accountNumber: 'ACC-12345',
    customerIdString: 'TEST-CUS-001',
    customerName: 'John Smith',
    loanTerms: {
      loanAmount: 500.0,
      loanFee: 80.0,
      totalPayable: 580.0,
      openedDate: new Date('2024-01-15'),
    },
    balances: {
      currentBalance: 350.0,
      totalOutstanding: 350.0,
      totalPaid: 230.0,
    },
    accountStatus: 'active',
    sdkStatus: 'ACTIVE',
    lastPayment: {
      date: new Date('2024-02-01'),
      amount: 115.0,
    },
    repaymentSchedule: {
      scheduleId: 'SCHED-001',
      numberOfPayments: 4,
      paymentFrequency: 'fortnightly',
      payments: [
        { paymentNumber: 1, dueDate: new Date('2024-01-22'), amount: 145.0, status: 'paid' },
        { paymentNumber: 2, dueDate: new Date('2024-02-05'), amount: 145.0, status: 'paid' },
        { paymentNumber: 3, dueDate: new Date('2024-02-19'), amount: 145.0, status: 'scheduled' },
        { paymentNumber: 4, dueDate: new Date('2024-03-04'), amount: 145.0, status: 'scheduled' },
      ],
      createdDate: new Date('2024-01-15'),
    },
  },
  account2: {
    loanAccountId: 'TEST-ACC-002',
    accountNumber: 'ACC-67890',
    customerIdString: 'TEST-CUS-001',
    customerName: 'John Smith',
    loanTerms: {
      loanAmount: 300.0,
      loanFee: 48.0,
      totalPayable: 348.0,
      openedDate: new Date('2023-11-01'),
    },
    balances: {
      currentBalance: 0.0,
      totalOutstanding: 0.0,
      totalPaid: 348.0,
    },
    accountStatus: 'paid_off',
    sdkStatus: 'CLOSED',
    lastPayment: {
      date: new Date('2023-12-15'),
      amount: 116.0,
    },
  },
  account3: {
    loanAccountId: 'TEST-ACC-003',
    accountNumber: 'ACC-11111',
    customerIdString: 'TEST-CUS-002',
    customerName: 'Jane Doe',
    loanTerms: {
      loanAmount: 400.0,
      loanFee: 64.0,
      totalPayable: 464.0,
      openedDate: new Date('2024-01-20'),
    },
    balances: {
      currentBalance: 464.0,
      totalOutstanding: 474.0, // Includes late fee
      totalPaid: 0.0,
    },
    accountStatus: 'in_arrears',
    sdkStatus: 'SUSPENDED',
  },
}

// Conversation test data (from chat events)
export const testConversations = {
  conversation1: {
    conversationId: 'CONV-001',
    customerIdString: 'TEST-CUS-001',
    applicationNumber: 'APP-12345',
    status: 'approved',
    startedAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    utterances: [
      {
        username: 'assistant',
        utterance: 'Hi! Welcome to Billie. How can I help you today?',
        createdAt: new Date('2024-01-10T10:00:00Z'),
      },
      {
        username: 'customer',
        utterance: 'I need a loan of $500',
        createdAt: new Date('2024-01-10T10:01:00Z'),
      },
      {
        username: 'assistant',
        utterance: 'Great! Let me help you with that. First, I need some details.',
        createdAt: new Date('2024-01-10T10:02:00Z'),
      },
    ],
    purpose: 'Loan application',
    facts: [{ fact: 'Customer requested $500 loan' }],
    finalDecision: 'APPROVED',
    assessments: {
      identityRisk: { score: 85, status: 'low_risk' },
      serviceability: { result: 'pass', affordability: true },
      fraudCheck: { result: 'clear' },
    },
  },
  conversation2: {
    conversationId: 'CONV-002',
    customerIdString: 'TEST-CUS-002',
    applicationNumber: 'APP-67890',
    status: 'active',
    startedAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
    utterances: [
      {
        username: 'assistant',
        utterance: 'Hello! How can I assist you?',
        createdAt: new Date('2024-02-01T09:00:00Z'),
      },
    ],
  },
}

// Mock gRPC responses for ledger API tests
export const mockLedgerResponses = {
  getBalance: {
    loanAccountId: 'TEST-ACC-001',
    principalBalance: '270.00',
    feeBalance: '80.00',
    totalOutstanding: '350.00',
    asOf: { seconds: Math.floor(Date.now() / 1000), nanos: 0 },
  },
  getTransactions: {
    transactions: [
      {
        transactionId: 'TXN-001',
        transactionType: 'DISBURSEMENT',
        description: 'Initial loan disbursement',
        principalDelta: '500.00',
        feeDelta: '0.00',
        runningBalance: '500.00',
        effectiveDate: { seconds: 1705276800, nanos: 0 }, // 2024-01-15
        createdAt: { seconds: 1705276800, nanos: 0 },
      },
      {
        transactionId: 'TXN-002',
        transactionType: 'ESTABLISHMENT_FEE',
        description: 'Loan establishment fee',
        principalDelta: '0.00',
        feeDelta: '80.00',
        runningBalance: '580.00',
        effectiveDate: { seconds: 1705276800, nanos: 0 },
        createdAt: { seconds: 1705276800, nanos: 0 },
      },
      {
        transactionId: 'TXN-003',
        transactionType: 'REPAYMENT',
        description: 'Customer payment',
        principalDelta: '-115.00',
        feeDelta: '0.00',
        runningBalance: '465.00',
        effectiveDate: { seconds: 1706745600, nanos: 0 }, // 2024-02-01
        createdAt: { seconds: 1706745600, nanos: 0 },
      },
    ],
    totalCount: 3,
  },
  getStatement: {
    accountNumber: 'ACC-12345',
    customerName: 'John Smith',
    openingBalance: '580.00',
    closingBalance: '350.00',
    totalDebits: '580.00',
    totalCredits: '230.00',
    transactions: [],
    startDate: { seconds: 1704067200, nanos: 0 },
    endDate: { seconds: 1709251200, nanos: 0 },
  },
}

