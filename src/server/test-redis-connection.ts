import { streamClient } from './redis-client'
import redis from './redis-client'

async function testRedisConnection() {
  console.log('🧪 Testing Redis connection and stream operations...')
  
  try {
    // Test basic Redis connection with timeout
    console.log('1. Testing basic Redis connection...')
    
    // Add a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Redis connection timeout')), 5000)
    })
    
    // Test basic ping
    const pingPromise = redis.ping()
    const pingResult = await Promise.race([pingPromise, timeoutPromise])
    console.log('✅ Redis ping successful:', pingResult)
    
    // Test stream operations
    console.log('2. Testing stream operations...')
    
    const testStream = 'test-chatLedger'
    const testGroup = 'test-payload-dashboard'
    const testConsumer = 'test-consumer-1'
    
    // Create consumer group
    await streamClient.createConsumerGroup(testStream, testGroup)
    
    // Add a test event
    const testEvent = {
      agt: 'broker',
      typ: 'test_event',
      cid: 'test-conversation-123',
      tsp: new Date().toISOString(),
      dat: { message: 'Hello from test' }
    }
    
    console.log('3. Adding test event to stream...')
    const messageId = await streamClient.addEvent(testStream, testEvent)
    console.log(`✅ Added event with ID: ${messageId}`)
    
    // Read the event back
    console.log('4. Reading events from stream...')
    const events = await streamClient.readEvents(testStream, testGroup, testConsumer, 1, 100)
    
    if (events && events.length > 0) {
      console.log(`✅ Read ${events.length} event(s) from stream`)
      console.log('Event data:', events[0])
      
      // Acknowledge the event
      console.log('5. Acknowledging event...')
      await streamClient.acknowledgeEvent(testStream, testGroup, events[0].messageId)
      console.log('✅ Event acknowledged')
    } else {
      console.log('⚠️  No events read from stream')
    }
    
    // Get stream info
    console.log('6. Getting stream information...')
    const streamInfo = await streamClient.getStreamInfo(testStream)
    console.log(`✅ Stream info: ${streamInfo.length} total messages`)
    
    console.log('🎉 All Redis stream tests passed!')
    
  } catch (error) {
    console.error('❌ Redis test failed:', error)
    
    // Check if Redis is running
    if (error.message && error.message.includes('ECONNREFUSED')) {
      console.error('💡 Hint: Make sure Redis is running. You can start it with: redis-server or docker run -d -p 6379:6379 redis:latest')
    }
    
    throw error
  } finally {
    // Clean up - disconnect
    try {
      await streamClient.disconnect()
    } catch (err) {
      console.warn('Warning: Error disconnecting from Redis:', err)
    }
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testRedisConnection()
    .then(() => {
      console.log('✅ Test completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Test failed:', error.message)
      process.exit(1)
    })
}

export { testRedisConnection } 