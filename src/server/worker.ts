import 'dotenv/config'
import Redis from 'ioredis'
import _ from 'lodash'
import { getPayload } from 'payload'
import config from '../payload.config'
import { publishRealTimeUpdate } from './redis-client'

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

// Worker configuration
const STREAM_KEY = 'chatLedger'
const CONSUMER_GROUP = 'supervisor-dashboard'
const CONSUMER_ID = 'worker-1'

// Initialize Payload CMS
let payload: any = null

const initializePayload = async () => {
  if (!payload) {
    payload = await getPayload({ config })
  }
  return payload
}

// Parse event fields from Redis stream format
const parseEvent = (fields: string[]): any => {
  const event: any = {}
  for (let i = 0; i < fields.length; i += 2) {
    const key = fields[i]
    const value = fields[i + 1]
    
    // Try to parse JSON values
    try {
      event[key] = JSON.parse(value)
    } catch {
      event[key] = value
    }
  }
  return event
}

// Update conversation state with new event data
const updateConversationState = async (conversationId: string, event: any) => {
  const payload = await initializePayload()
  
  // Get existing conversation from MongoDB via Payload
  let conversation = null
  let existingDoc = null
  
  // Find existing conversation by conversationId
  const existingConversations = await payload.find({
    collection: 'conversations',
    where: {
      conversationId: { equals: conversationId }
    }
  })
  
 
  if (existingConversations.docs.length > 0) {
    existingDoc = existingConversations.docs[0]
    conversation = {
      id: existingDoc.id,
      applicationNumber: existingDoc.applicationNumber,
      status: existingDoc.status,
      messages: existingDoc.messages || [],
      assessments: existingDoc.assessments || {},
      noticeboard: existingDoc.noticeboard || [],
      version: existingDoc.version || 1,
      startTime: existingDoc.startTime,
      lastUtteranceTime: existingDoc.lastUtteranceTime,
      finalDecision: existingDoc.finalDecision,
      customerId: existingDoc.customerId
    }
  } else {
    // Create new conversation state
    conversation = {
      id: conversationId,
      status: 'active',
      messages: [],
      assessments: {},
      noticeboard: [],
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  // Extract applicationNumber from payload if not at top level
  if (event.payload && event.payload.application_number) {
    conversation.applicationNumber = event.payload.application_number
  }

  // Update based on event type
  switch (event.typ) {
    case 'conversation_started':
      conversation.startTime = event.timestamp || new Date().toISOString()

      break

    case 'user_input':
    case 'assistant_response':
      const message = {
        sender: event.typ === 'user_input' ? 'customer' : 'assistant',
        utterance: event.payload.utterance || '',
        timestamp: event.payload.created_at || new Date().toISOString()
      }
      conversation.messages = conversation.messages || []
      conversation.messages.push(message)
      conversation.lastUtteranceTime = message.timestamp

      break

    case 'applicationDetail_changed':
      // Merge application details

      // Handle customer data
      if (event.customer) {
        conversation.customer = _.merge(conversation.customer || {}, event.customer)
        
        // Update customer profile separately
        if (event.customer.customer_id || event.customer_id) {
          const customerId = event.customer.customer_id || event.customer_id
          await updateCustomerState(customerId, event.customer)
        }
      }
      
      // Handle customer data from payload
      if (event.payload && event.payload.customer) {
        conversation.customer = _.merge(conversation.customer || {}, event.payload.customer)
        
        // Update customer profile separately
        if (event.payload.customer.customer_id || event.payload.customer.customerId) {
          const customerId = event.payload.customer.customer_id || event.payload.customer.customerId
          await updateCustomerState(customerId, event.payload.customer)
        }
      }
      
      // Merge other application details
      const applicationFields = { ...event }
      delete applicationFields.typ
      delete applicationFields.agt
      delete applicationFields.timestamp
      delete applicationFields.customer
      
      conversation.application = _.merge(conversation.application || {}, applicationFields)
      break

    case 'identityRisk_assessment':
      conversation.assessments.identityRisk = event.payload || event
      break

    case 'serviceability_assessment_results':
      conversation.assessments.serviceability = event.payload || event
      break

    case 'fraudCheck_assessment':
      conversation.assessments.fraudCheck = event.payload || event
      break

    case 'noticeboard_updated':
      const agentName = event.agentName || 'unknown'
      const content = event.content || ''
      const timestamp = event.timestamp || new Date().toISOString()
      
      // Extract topic from agentName (e.g., "serviceability_agent::Serviceability Assessment")
      const topic = agentName.includes('::') ? agentName.split('::')[1] : agentName
      
      // Store previous version if it exists
      if (conversation.noticeboard[agentName]) {
        const existing = conversation.noticeboard[agentName]
        existing.versions = existing.versions || []
        existing.versions.push({
          content: existing.content,
          timestamp: existing.timestamp
        })
      }
      
      conversation.noticeboard[agentName] = {
        agentName,
        content,
        timestamp,
        versions: conversation.noticeboard[agentName]?.versions || []
      }
      break

    case 'final_decision':
      conversation.finalDecision = event.decision || event.outcome
      if (event.decision === 'APPROVED') {
        conversation.status = 'approved'
      } else if (event.decision === 'DECLINED') {
        conversation.status = 'declined'
      }
      break
  }

  // Update metadata
  conversation.version = (conversation.version || 1) + 1
  conversation.updatedAt = new Date().toISOString()

  // Save directly to MongoDB via Payload
  await saveConversationToPayload(conversation, existingDoc, payload)
  
  return conversation
}

// Save conversation directly to MongoDB via Payload
const saveConversationToPayload = async (conversation: any, existingDoc: any, payload: any) => {
  try {
    // First, sync customer data if it exists
    let customerId = null
    if (conversation.customer && conversation.customer.customer_id) {
      customerId = await syncCustomerToPayload(conversation.customer, payload)
    }

    // Try to find applicationNumber from various sources
    let applicationNumber = conversation.applicationNumber
    // if (!applicationNumber && conversation.application && conversation.application.payload) {
    //   applicationNumber = conversation.application.payload.applicationNumber
    // }
    // if (!applicationNumber && conversation.application && conversation.application.applicationNumber) {
    //   applicationNumber = conversation.application.applicationNumber
    // }
    
    // Skip save if still missing required fields
    if (!applicationNumber) {
      console.warn('Skipping MongoDB save - missing applicationNumber')
      return
    }

    // Build clean conversation data - ONLY include fields that exist in our Conversations schema
    // Create a completely fresh object to avoid any field contamination
    const conversationData: any = {}
    
    // Required fields
    conversationData.applicationNumber = applicationNumber
    
    // Optional fields - only add if they have valid values
    if (conversation.conversationId) {
      conversationData.conversationId = conversation.conversationId
    }
    
    if (customerId) {
      conversationData.customerId = customerId
    }
    
    if (conversation.status) {
      conversationData.status = conversation.status
    }
    
    if (conversation.startTime) {
      conversationData.startTime = conversation.startTime
    }
    
    if (conversation.lastUtteranceTime) {
      conversationData.lastUtteranceTime = conversation.lastUtteranceTime
    }
    
    // Messages - filter out empty messages and create clean message objects
    const validMessages = (conversation.messages || []).filter(msg => 
      msg.utterance && msg.utterance.trim() !== '' && msg.sender && msg.timestamp
    ).map(msg => ({
      sender: msg.sender,
      utterance: msg.utterance,
      timestamp: msg.timestamp
    }))
    if (validMessages.length > 0) {
      conversationData.messages = validMessages
    } else {
      conversationData.messages = []
    }
    
    // Assessments - create clean assessment object
    if (conversation.assessments && Object.keys(conversation.assessments).length > 0) {
      conversationData.assessments = {}
      if (conversation.assessments.identityRisk) {
        conversationData.assessments.identityRisk = conversation.assessments.identityRisk
      }
      if (conversation.assessments.serviceability) {
        conversationData.assessments.serviceability = conversation.assessments.serviceability
      }
      if (conversation.assessments.fraudCheck) {
        conversationData.assessments.fraudCheck = conversation.assessments.fraudCheck
      }
    } else {
      conversationData.assessments = {}
    }
    
    // Noticeboard - create clean noticeboard array
    const noticeboardArray = Array.isArray(conversation.noticeboard) 
      ? conversation.noticeboard 
      : Object.values(conversation.noticeboard || {})
    
    if (noticeboardArray.length > 0) {
      conversationData.noticeboard = noticeboardArray.map(notice => ({
        agentName: notice.agentName || 'Unknown',
        content: notice.content || '',
        timestamp: notice.timestamp || new Date(),
        versions: notice.versions || []
      }))
    } else {
      conversationData.noticeboard = []
    }
    
    // Final decision
    if (conversation.finalDecision) {
      conversationData.finalDecision = conversation.finalDecision
    }
    
    // Version
    if (conversation.version) {
      conversationData.version = conversation.version
    }

    // Debug logging
    console.log('Clean conversation data for MongoDB:', JSON.stringify(conversationData, null, 2))

    if (existingDoc) {
      // Update existing conversation
      console.log(`Updating conversation ${applicationNumber} in MongoDB`)
      await payload.update({
        collection: 'conversations',
        id: existingDoc.id,
        data: conversationData
      })
    } else {
      // Create new conversation
      console.log(`Creating new conversation ${applicationNumber} in MongoDB`)
      
      // Additional debug - let's see what's actually being passed
      console.log('About to create with data:', JSON.stringify(conversationData, null, 2))
      console.log('Data keys:', Object.keys(conversationData))
      
      const newDoc = await payload.create({
        collection: 'conversations',
        data: conversationData
      })
      conversation.id = newDoc.id
    }
  } catch (error) {
    console.error('Error saving conversation to MongoDB:', error)
    console.error('Original conversation object keys:', Object.keys(conversation))
    console.error('Problematic conversation data:', JSON.stringify(conversation, null, 2))
    // Don't throw error to prevent worker from stopping
  }
}

// Update customer state directly in MongoDB
const updateCustomerState = async (customerId: string, customerData: any) => {
  const payload = await initializePayload()
  return await syncCustomerToPayload(customerData, payload)
}



// Sync customer data to Payload CMS
const syncCustomerToPayload = async (customerData: any, payload: any) => {
  if (!customerData || !customerData.customer_id) {
    console.log('No customer data to sync')
    return null
  }

  try {
    const customerId = customerData.customer_id
    
    // Check if customer already exists
    const existingCustomers = await payload.find({
      collection: 'customers',
      where: {
        customerId: {
          equals: customerId
        }
      }
    })

    // Build clean customer data - ONLY include fields that exist in our Customers schema
    const customerPayload: any = {}
    
    // Required fields
    customerPayload.customerId = customerId
    customerPayload.fullName = customerData.full_name || customerData.name || `Customer ${customerId}`
    
    // Optional fields
    if (customerData.email || customerData.email_address) {
      customerPayload.email = customerData.email || customerData.email_address
    }
    
    if (customerData.date_of_birth) {
      customerPayload.dateOfBirth = customerData.date_of_birth
    }
    
    if (customerData.phone || customerData.mobile_phone_number) {
      customerPayload.phone = customerData.phone || customerData.mobile_phone_number
    }
    
    if (customerData.residential_address) {
      customerPayload.residentialAddress = {
        street: customerData.residential_address.street || '',
        city: customerData.residential_address.city || '',
        state: customerData.residential_address.state || '',
        postcode: customerData.residential_address.postcode || ''
      }
    }
    
    console.log('Clean customer data for MongoDB:', JSON.stringify(customerPayload, null, 2))

    if (existingCustomers.docs.length > 0) {
      // Update existing customer
      const existingCustomer = existingCustomers.docs[0]
      console.log(`Updating customer ${customerId} in MongoDB`)
      await payload.update({
        collection: 'customers',
        id: existingCustomer.id,
        data: customerPayload
      })
      return existingCustomer.id
    } else {
      // Create new customer
      console.log(`Creating new customer ${customerId} in MongoDB`)
      const newCustomer = await payload.create({
        collection: 'customers',
        data: customerPayload
      })
      return newCustomer.id
    }
  } catch (error) {
    console.error('Error syncing customer to MongoDB:', error)
    return null
  }
}

// Process individual event
const processEvent = async (event: any) => {
  try {
    // Use conversation ID from event, or generate one if missing
    const conversationId = event.conversation_id || event.conv || event.conversationId || `conv-${Date.now()}`
    
    console.log(`Processing event: ${event.typ} for conversation ${conversationId}`)
    
    // Update conversation state and save directly to MongoDB
    const conversation = await updateConversationState(conversationId, event)
    console.log(`✅ Updated conversation state for ${conversationId}`)
    
    // Publish real-time update
    await publishRealTimeUpdate('payload-updates', {
      collection: 'conversations',
      operation: 'update',
      doc: conversation,
      timestamp: new Date().toISOString()
    })
    console.log(`✅ Published real-time update for ${conversationId}`)
    
  } catch (error) {
    console.error(`❌ Error processing event ${event.typ} for conversation ${event.conversation_id || 'unknown'}:`, error)
  }
}

// Main worker loop
const run = async () => {
  console.log('Starting Redis stream worker...')
  
  // Initialize Payload
  await initializePayload()
  
  // Create consumer group if it doesn't exist
  try {
    await redis.xgroup('CREATE', STREAM_KEY, CONSUMER_GROUP, '0', 'MKSTREAM')
    console.log(`Created consumer group: ${CONSUMER_GROUP}`)
  } catch (error) {
    // Group might already exist
    console.log(`Consumer group ${CONSUMER_GROUP} already exists`)
  }

  // Main processing loop
  while (true) {
    try {
      const results = await redis.xreadgroup(
        'GROUP',
        CONSUMER_GROUP,
        CONSUMER_ID,
        'COUNT',
        10,
        'BLOCK',
        1000,
        'STREAMS',
        STREAM_KEY,
        '>'
      )

      if (results && results.length > 0) {
        const [streamName, messages] = results[0]
        
        for (const [messageId, fields] of messages) {
          try {
            const event = parseEvent(fields)
            
            // Only process events from 'broker' agent
            if (event.agt === 'broker') {
              await processEvent(event)
            }
            
            // Acknowledge message
            await redis.xack(STREAM_KEY, CONSUMER_GROUP, messageId)
          } catch (error) {
            console.error(`Error processing message ${messageId}:`, error)
          }
        }
      }
    } catch (error) {
      console.error('Error in main loop:', error)
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
  }
}

// Start the worker
if (process.env.NODE_ENV !== 'test') {
  run().catch(console.error)
}

export { run, processEvent, updateConversationState } 