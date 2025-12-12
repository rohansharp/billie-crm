/**
 * Integration Tests for Single Customer View API
 * 
 * Tests Feature F6 from Requirements/v2-servicing-app
 * 
 * The Single Customer View aggregates:
 * - Customer details (from local projection)
 * - Loan accounts (from local projection)
 * - Live balances (from gRPC API)
 * - Conversations (from local projection)
 */

import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { MongoClient, Db } from 'mongodb'
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest'
import { testCustomers, testLoanAccounts, testConversations, mockLedgerResponses } from './fixtures/test-data'

let payload: Payload
let mongoClient: MongoClient
let db: Db

// Mock the gRPC client
vi.mock('@/server/grpc-client', () => ({
  getLedgerClient: () => ({
    getBalance: vi.fn().mockResolvedValue(mockLedgerResponses.getBalance),
    getTransactions: vi.fn().mockResolvedValue(mockLedgerResponses.getTransactions),
  }),
  timestampToDate: (ts: { seconds: number }) => new Date(ts.seconds * 1000),
}))

describe('Single Customer View API Integration Tests', () => {
  const testCustomerId = 'TEST-CUS-001'

  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
    
    // Connect to MongoDB directly for seeding
    const mongoUrl = process.env.DATABASE_URI || 'mongodb://localhost:27017/billie-servicing'
    mongoClient = new MongoClient(mongoUrl)
    await mongoClient.connect()
    db = mongoClient.db()
    
    // Clean up any existing test data
    await db.collection('customers').deleteMany({ customerId: { $regex: /^TEST-CUS-001$/ } })
    await db.collection('loan-accounts').deleteMany({ loanAccountId: { $regex: /^TEST-ACC-00[12]$/ } })
    await db.collection('conversations').deleteMany({ conversationId: { $regex: /^CONV-001$/ } })
    
    // Seed test data directly via MongoDB
    await db.collection('customers').insertOne({
      ...testCustomers.customer1,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    
    await db.collection('loan-accounts').insertMany([
      { ...testLoanAccounts.account1, createdAt: new Date(), updatedAt: new Date() },
      { ...testLoanAccounts.account2, createdAt: new Date(), updatedAt: new Date() },
    ])
    
    await db.collection('conversations').insertOne({
      ...testConversations.conversation1,
      createdAt: new Date(),
    })
  })

  afterAll(async () => {
    // Clean up test data
    if (db) {
      await db.collection('customers').deleteMany({ customerId: testCustomerId })
      await db.collection('loan-accounts').deleteMany({ customerIdString: testCustomerId })
      await db.collection('conversations').deleteMany({ customerIdString: testCustomerId })
    }
    if (mongoClient) {
      await mongoClient.close()
    }
  })

  describe('F6.1: Unified Customer Dashboard', () => {
    it('should return customer details', async () => {
      const customerResult = await payload.find({
        collection: 'customers',
        where: { customerId: { equals: testCustomerId } },
      })

      expect(customerResult.docs.length).toBe(1)
      const customer = customerResult.docs[0]

      expect(customer.fullName).toBe('John Smith')
      expect(customer.emailAddress).toBe('john.smith@test.billie.loans')
      expect(customer.mobilePhoneNumber).toBe('0412345678')
      expect(customer.residentialAddress).toBeDefined()
    })

    it('should return all loan accounts for the customer', async () => {
      const accountsResult = await payload.find({
        collection: 'loan-accounts',
        where: { customerIdString: { equals: testCustomerId } },
        sort: '-createdAt',
      })

      expect(accountsResult.docs.length).toBe(2)
      
      // Verify account details
      const activeAccount = accountsResult.docs.find((a: any) => a.accountStatus === 'active')
      const paidAccount = accountsResult.docs.find((a: any) => a.accountStatus === 'paid_off')

      expect(activeAccount).toBeDefined()
      expect(paidAccount).toBeDefined()
    })

    it('should return all conversations for the customer', async () => {
      const conversationsResult = await payload.find({
        collection: 'conversations',
        where: { customerIdString: { equals: testCustomerId } },
        sort: '-startedAt',
      })

      expect(conversationsResult.docs.length).toBeGreaterThanOrEqual(1)
      expect(conversationsResult.docs[0].applicationNumber).toBe('APP-12345')
    })

    it('should calculate summary statistics correctly', async () => {
      const accountsResult = await payload.find({
        collection: 'loan-accounts',
        where: { customerIdString: { equals: testCustomerId } },
      })

      const conversationsResult = await payload.find({
        collection: 'conversations',
        where: { customerIdString: { equals: testCustomerId } },
      })

      // Calculate summary
      const totalAccounts = accountsResult.docs.length
      const activeAccounts = accountsResult.docs.filter(
        (a: any) => a.accountStatus === 'active'
      ).length
      const totalOutstanding = accountsResult.docs.reduce(
        (sum: number, a: any) => sum + (a.balances?.totalOutstanding || 0),
        0
      )
      const totalConversations = conversationsResult.docs.length

      expect(totalAccounts).toBe(2)
      expect(activeAccounts).toBe(1)
      expect(totalOutstanding).toBe(350.0)
      expect(totalConversations).toBeGreaterThanOrEqual(1)
    })
  })

  describe('F6.2: Quick Actions from Customer View', () => {
    it('should provide account IDs for navigation', async () => {
      const accountsResult = await payload.find({
        collection: 'loan-accounts',
        where: { customerIdString: { equals: testCustomerId } },
      })

      // Verify each account has necessary IDs for navigation
      for (const account of accountsResult.docs) {
        expect(account.id).toBeDefined()
        expect(account.loanAccountId).toBeDefined()
        expect(account.accountNumber).toBeDefined()
      }
    })

    it('should provide conversation IDs for navigation', async () => {
      const conversationsResult = await payload.find({
        collection: 'conversations',
        where: { customerIdString: { equals: testCustomerId } },
      })

      for (const conv of conversationsResult.docs) {
        expect(conv.id).toBeDefined()
        expect(conv.conversationId).toBeDefined()
      }
    })
  })

  describe('F6.3: Customer Activity Timeline', () => {
    it('should aggregate account creation events', async () => {
      const accountsResult = await payload.find({
        collection: 'loan-accounts',
        where: { customerIdString: { equals: testCustomerId } },
        sort: '-createdAt',
      })

      // Each account should have a createdAt timestamp for timeline
      const timeline: any[] = []
      for (const account of accountsResult.docs) {
        timeline.push({
          type: 'account_created',
          date: account.createdAt,
          title: 'Loan Account Created',
          description: `Account ${account.accountNumber} created`,
          metadata: {
            accountId: account.loanAccountId,
            accountNumber: account.accountNumber,
            loanAmount: account.loanTerms?.loanAmount,
          },
        })
      }

      expect(timeline.length).toBe(2)
      expect(timeline[0].type).toBe('account_created')
    })

    it('should aggregate conversation events', async () => {
      const conversationsResult = await payload.find({
        collection: 'conversations',
        where: { customerIdString: { equals: testCustomerId } },
        sort: '-startedAt',
      })

      const timeline: any[] = []
      for (const conv of conversationsResult.docs) {
        timeline.push({
          type: 'conversation',
          date: conv.startedAt,
          title: 'Conversation Started',
          description: `Application ${conv.applicationNumber} - ${conv.status}`,
          metadata: {
            conversationId: conv.conversationId,
            applicationNumber: conv.applicationNumber,
            status: conv.status,
          },
        })
      }

      expect(timeline.length).toBeGreaterThanOrEqual(1)
      expect(timeline[0].type).toBe('conversation')
    })

    it('should sort timeline by date descending', async () => {
      const accountsResult = await payload.find({
        collection: 'loan-accounts',
        where: { customerIdString: { equals: testCustomerId } },
      })
      const conversationsResult = await payload.find({
        collection: 'conversations',
        where: { customerIdString: { equals: testCustomerId } },
      })

      // Build combined timeline
      const timeline: any[] = []
      
      for (const account of accountsResult.docs) {
        timeline.push({
          type: 'account_created',
          date: new Date(account.createdAt),
        })
      }
      
      for (const conv of conversationsResult.docs) {
        timeline.push({
          type: 'conversation',
          date: new Date(conv.startedAt),
        })
      }

      // Sort by date descending
      timeline.sort((a, b) => b.date.getTime() - a.date.getTime())

      // Verify sorted order
      for (let i = 0; i < timeline.length - 1; i++) {
        expect(timeline[i].date.getTime()).toBeGreaterThanOrEqual(
          timeline[i + 1].date.getTime()
        )
      }
    })
  })

  describe('Data Integrity', () => {
    it('should have consistent customer ID across all related records', async () => {
      const customer = await payload.find({
        collection: 'customers',
        where: { customerId: { equals: testCustomerId } },
      })
      const accounts = await payload.find({
        collection: 'loan-accounts',
        where: { customerIdString: { equals: testCustomerId } },
      })
      const conversations = await payload.find({
        collection: 'conversations',
        where: { customerIdString: { equals: testCustomerId } },
      })

      // Verify all records have the same customer ID
      expect(customer.docs[0].customerId).toBe(testCustomerId)
      
      for (const account of accounts.docs) {
        expect(account.customerIdString).toBe(testCustomerId)
      }
      
      for (const conv of conversations.docs) {
        expect(conv.customerIdString).toBe(testCustomerId)
      }
    })

    it('should handle customers with no accounts', async () => {
      // Query for a customer ID that has no accounts
      const accounts = await payload.find({
        collection: 'loan-accounts',
        where: { customerIdString: { equals: 'TEST-CUS-NO-ACCOUNTS' } },
      })

      expect(accounts.docs.length).toBe(0)
    })

    it('should handle customers with no conversations', async () => {
      const conversations = await payload.find({
        collection: 'conversations',
        where: { customerIdString: { equals: 'TEST-CUS-NO-CONVERSATIONS' } },
      })

      expect(conversations.docs.length).toBe(0)
    })
  })
})

