import { describe, test, expect, vi } from 'vitest'
import { Applications } from '../../src/collections/Applications'
import { Customers } from '../../src/collections/Customers'
import { Conversations } from '../../src/collections/Conversations'
import { Users } from '../../src/collections/Users'
import { Media } from '../../src/collections/Media'
import { createMockPayloadRequest } from '../utils/test-helpers'

describe('Payload Collections Configuration', () => {
  describe('Applications Collection', () => {
    test('should have correct slug and configuration', () => {
      expect(Applications.slug).toBe('applications')
      expect(Applications.admin?.group).toBe('Supervisor Dashboard')
      expect(Applications.admin?.useAsTitle).toBe('applicationNumber')
    })

    test('should have required fields', () => {
      const requiredFields = ['applicationNumber', 'customerId']
      const fieldNames = Applications.fields?.map(field => field.name)
      
      requiredFields.forEach(fieldName => {
        expect(fieldNames).toContain(fieldName)
      })
    })

    test('should have proper access control for supervisors', () => {
      const mockSupervisorRequest = createMockPayloadRequest({ role: 'supervisor' })
      const mockAdminRequest = createMockPayloadRequest({ role: 'admin' })
      const mockUserRequest = createMockPayloadRequest({ role: 'user' })

      expect(Applications.access?.read?.(mockSupervisorRequest)).toBe(true)
      expect(Applications.access?.read?.(mockAdminRequest)).toBe(true)
      expect(Applications.access?.read?.(mockUserRequest)).toBe(false)
    })

    test('should prevent direct create/update/delete operations', () => {
      const mockRequest = createMockPayloadRequest({ role: 'admin' })
      
      expect(Applications.access?.create?.(mockRequest)).toBe(false)
      expect(Applications.access?.update?.(mockRequest)).toBe(false)
      expect(Applications.access?.delete?.(mockRequest)).toBe(false)
    })

    test('should have proper field types and configurations', () => {
      const fields = Applications.fields || []
      
      // Check applicationNumber field
      const appNumberField = fields.find(f => f.name === 'applicationNumber')
      expect(appNumberField?.type).toBe('text')
      expect(appNumberField?.required).toBe(true)
      expect(appNumberField?.unique).toBe(true)
      expect(appNumberField?.admin?.readOnly).toBe(true)

      // Check customer relationship
      const customerField = fields.find(f => f.name === 'customerId')
      expect(customerField?.type).toBe('relationship')
      expect(customerField?.relationTo).toBe('customers')

      // Check loan amount field
      const loanAmountField = fields.find(f => f.name === 'loanAmount')
      expect(loanAmountField?.type).toBe('number')
      expect(loanAmountField?.admin?.readOnly).toBe(true)
    })

    test('should have nested application process structure', () => {
      const fields = Applications.fields || []
      const appProcessField = fields.find(f => f.name === 'applicationProcess')
      
      expect(appProcessField?.type).toBe('group')
      expect(appProcessField?.admin?.readOnly).toBe(true)
      expect(appProcessField?.fields).toBeDefined()
    })
  })

  describe('Customers Collection', () => {
    test('should have correct slug and configuration', () => {
      expect(Customers.slug).toBe('customers')
      expect(Customers.admin?.group).toBe('Supervisor Dashboard')
      expect(Customers.admin?.useAsTitle).toBe('fullName')
    })

    test('should have identity document structure', () => {
      const fields = Customers.fields || []
      const identityDocsField = fields.find(f => f.name === 'identityDocuments')
      
      expect(identityDocsField?.type).toBe('array')
      expect(identityDocsField?.admin?.readOnly).toBe(true)
      expect(identityDocsField?.fields).toBeDefined()
    })

    test('should have address groups', () => {
      const fields = Customers.fields || []
      const residentialField = fields.find(f => f.name === 'residentialAddress')
      const mailingField = fields.find(f => f.name === 'mailingAddress')
      
      expect(residentialField?.type).toBe('group')
      expect(mailingField?.type).toBe('group')
      expect(residentialField?.admin?.readOnly).toBe(true)
      expect(mailingField?.admin?.readOnly).toBe(true)
    })

    test('should have fullName field as readOnly text', () => {
      const fields = Customers.fields || []
      const fullNameField = fields.find(f => f.name === 'fullName')
      
      // fullName is now set directly by the event processor, no hook needed
      expect(fullNameField?.type).toBe('text')
      expect(fullNameField?.admin?.readOnly).toBe(true)
    })

    test('fullName should be set by event processor (no client-side hook)', () => {
      const fields = Customers.fields || []
      const fullNameField = fields.find(f => f.name === 'fullName')
      
      // The hook was removed - fullName is now populated by Python event processor
      // This is intentional as data comes from customer.changed.v1 events
      expect(fullNameField?.hooks?.beforeChange).toBeUndefined()
    })

    test('should have relationships to applications and conversations', () => {
      const fields = Customers.fields || []
      const appsField = fields.find(f => f.name === 'applications')
      const convsField = fields.find(f => f.name === 'conversations')
      
      expect(appsField?.type).toBe('relationship')
      expect(appsField?.relationTo).toBe('applications')
      expect(appsField?.hasMany).toBe(true)
      
      expect(convsField?.type).toBe('relationship')
      expect(convsField?.relationTo).toBe('conversations')
      expect(convsField?.hasMany).toBe(true)
    })
  })

  describe('Conversations Collection', () => {
    test('should have correct slug and configuration', () => {
      expect(Conversations.slug).toBe('conversations')
      expect(Conversations.admin?.group).toBe('Supervisor Dashboard')
      expect(Conversations.admin?.useAsTitle).toBe('applicationNumber')
    })

    test('should have utterances array instead of messages', () => {
      const fields = Conversations.fields || []
      const utterancesField = fields.find(f => f.name === 'utterances')
      const messagesField = fields.find(f => f.name === 'messages')
      
      expect(utterancesField).toBeDefined()
      expect(utterancesField?.type).toBe('array')
      expect(utterancesField?.admin?.readOnly).toBe(true)
      expect(messagesField).toBeUndefined()
    })

    test('should have conversation relationships', () => {
      const fields = Conversations.fields || []
      const customerField = fields.find(f => f.name === 'customerId')
      const applicationField = fields.find(f => f.name === 'applicationId')
      
      expect(customerField?.type).toBe('relationship')
      expect(customerField?.relationTo).toBe('customers')
      expect(applicationField?.type).toBe('relationship')
      expect(applicationField?.relationTo).toBe('applications')
    })

    test('should have proper utterance structure', () => {
      const fields = Conversations.fields || []
      const utterancesField = fields.find(f => f.name === 'utterances')
      
      expect(utterancesField?.fields).toBeDefined()
      
      const utteranceFields = utterancesField?.fields || []
      const fieldNames = utteranceFields.map(f => f.name)
      
      expect(fieldNames).toContain('username')
      expect(fieldNames).toContain('utterance')
      expect(fieldNames).toContain('rationale')
      expect(fieldNames).toContain('createdAt')
      expect(fieldNames).toContain('answerInputType')
      expect(fieldNames).toContain('additionalData')
    })

    test('should have conversation summary fields', () => {
      const fields = Conversations.fields || []
      const purposeField = fields.find(f => f.name === 'purpose')
      const factsField = fields.find(f => f.name === 'facts')
      
      expect(purposeField?.type).toBe('text')
      expect(purposeField?.admin?.readOnly).toBe(true)
      expect(factsField?.type).toBe('array')
      expect(factsField?.admin?.readOnly).toBe(true)
    })
  })

  describe('Users Collection', () => {
    test('should have all staff roles (admin, supervisor, operations, readonly)', () => {
      const fields = Users.fields || []
      const roleField = fields.find(f => f.name === 'role')
      
      expect(roleField?.type).toBe('select')
      expect(roleField?.defaultValue).toBe('supervisor')
      
      // Roles are now objects with label/value
      const options = roleField?.options as Array<{ label: string; value: string }>
      const roleValues = options?.map((opt) => opt.value) || []
      
      expect(roleValues).toContain('admin')
      expect(roleValues).toContain('supervisor')
      expect(roleValues).toContain('operations')
      expect(roleValues).toContain('readonly')
    })

    test('should have proper access control', () => {
      const mockAdminRequest = createMockPayloadRequest({ role: 'admin' })
      const mockSupervisorRequest = createMockPayloadRequest({ role: 'supervisor', id: 'user123' })
      const mockOtherUserRequest = createMockPayloadRequest({ role: 'supervisor', id: 'user456' })
      
      // Admin can create users
      expect(Users.access?.create?.(mockAdminRequest)).toBe(true)
      expect(Users.access?.create?.(mockSupervisorRequest)).toBe(false)
      
      // Users can read their own data, admins can read all
      expect(Users.access?.read?.({ ...mockAdminRequest, id: 'any-id' })).toBe(true)
      expect(Users.access?.read?.({ ...mockSupervisorRequest, id: 'user123' })).toBe(true)
      expect(Users.access?.read?.({ ...mockSupervisorRequest, id: 'user456' })).toBe(false)
    })
  })

  describe('Media Collection', () => {
    test('should have basic upload configuration', () => {
      expect(Media.slug).toBe('media')
      expect(Media.upload).toBe(true)
      expect(Media.access?.read?.()).toBe(true)
    })

    test('should have alt field for accessibility', () => {
      const fields = Media.fields || []
      const altField = fields.find(f => f.name === 'alt')
      
      expect(altField?.type).toBe('text')
      expect(altField?.required).toBe(true)
    })
  })
}) 