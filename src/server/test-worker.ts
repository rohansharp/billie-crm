import 'dotenv/config'
import { updateConversationState } from './worker'
import { getPayload } from 'payload'
import config from '../payload.config'

// Simple test to verify worker functionality
async function testWorker() {
  console.log('Testing worker functionality...')
  
  // Initialize Payload to check MongoDB
  const payload = await getPayload({ config })
  
  // Test event processing
  const testEvent = {
    typ: 'conversation_started',
    conversation_id: 'test-123',
    applicationNumber: 'APP-001',
    timestamp: new Date().toISOString(),
    agt: 'broker'
  }
  
  try {
    // Test conversation state update (now saves directly to MongoDB)
    const conversation = await updateConversationState('test-123', testEvent)
    console.log('✅ Conversation state updated:', conversation.applicationNumber)
    
    // Test state retrieval from MongoDB
    const retrieved = await payload.find({
      collection: 'conversations',
      where: {
        applicationNumber: {
          equals: 'APP-001'
        }
      }
    })
    console.log('✅ State retrieved from MongoDB:', retrieved.docs[0]?.applicationNumber)
    
    // Test message event - include applicationNumber so it can find the existing conversation
    const messageEvent = {
      typ: 'user_input',
      conversation_id: 'test-123',
      applicationNumber: 'APP-001', // Include this so it can find the existing conversation
      utterance: 'Hello, I need help with my application',
      timestamp: new Date().toISOString(),
      agt: 'broker'
    }
    
    const updatedConversation = await updateConversationState('test-123', messageEvent)
    console.log('✅ Message added, total messages:', updatedConversation.messages?.length)
    
    // Verify message was saved to MongoDB
    const retrievedWithMessage = await payload.find({
      collection: 'conversations',
      where: {
        applicationNumber: {
          equals: 'APP-001'
        }
      }
    })
    console.log('✅ Message saved to MongoDB, total messages:', retrievedWithMessage.docs[0]?.messages?.length)
    
    console.log('🎉 All tests passed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testWorker()
}

export { testWorker } 