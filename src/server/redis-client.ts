import 'dotenv/config'
import Redis from 'ioredis'

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

// Helper function to publish real-time updates
export const publishRealTimeUpdate = async (channel: string, data: any) => {
  try {
    await redis.publish(channel, JSON.stringify(data))
  } catch (error) {
    console.error(`Error publishing to ${channel}:`, error)
  }
}

// Enhanced Redis Stream Client for event sourcing
export class RedisStreamClient {
  private redis: Redis

  constructor(redisInstance?: Redis) {
    this.redis = redisInstance || redis
  }

  /**
   * Create a consumer group for a stream
   */
  async createConsumerGroup(stream: string, group: string, startId: string = '0'): Promise<void> {
    try {
      await this.redis.xgroup('CREATE', stream, group, startId, 'MKSTREAM')
      console.log(`Created consumer group: ${group} for stream: ${stream}`)
    } catch (error: any) {
      // Ignore error if group already exists
      if (error.message && error.message.includes('BUSYGROUP')) {
        console.log(`Consumer group ${group} already exists for stream: ${stream}`)
      } else {
        console.error(`Error creating consumer group ${group} for stream ${stream}:`, error)
        throw error
      }
    }
  }

  /**
   * Add an event to a stream
   */
  async addEvent(stream: string, event: Record<string, any>): Promise<string> {
    try {
      const fields: string[] = []
      
      for (const [key, value] of Object.entries(event)) {
        fields.push(key)
        // Convert objects to JSON strings
        fields.push(typeof value === 'object' ? JSON.stringify(value) : String(value))
      }

      const messageId = await this.redis.xadd(stream, '*', ...fields)
      console.log(`Added event to ${stream} with ID: ${messageId}`)
      return messageId
    } catch (error) {
      console.error(`Error adding event to stream ${stream}:`, error)
      throw error
    }
  }

  /**
   * Read events from a stream using consumer group
   */
  async readEvents(
    stream: string, 
    group: string, 
    consumer: string, 
    count: number = 10,
    block: number = 1000
  ): Promise<Array<{ messageId: string; fields: string[] }> | null> {
    try {
      const results = await this.redis.xreadgroup(
        'GROUP',
        group,
        consumer,
        'COUNT',
        count,
        'BLOCK',
        block,
        'STREAMS',
        stream,
        '>'
      )

      if (!results || results.length === 0) {
        return null
      }

      const [streamName, messages] = results[0]
      return messages.map(([messageId, fields]) => ({ messageId, fields }))
    } catch (error) {
      console.error(`Error reading events from stream ${stream}:`, error)
      throw error
    }
  }

  /**
   * Read pending messages for a consumer group
   */
  async readPendingEvents(
    stream: string,
    group: string,
    consumer: string,
    count: number = 100
  ): Promise<Array<{ messageId: string; fields: string[] }> | null> {
    try {
      const results = await this.redis.xreadgroup(
        'GROUP',
        group,
        consumer,
        'COUNT',
        count,
        'STREAMS',
        stream,
        '0' // '0' gets pending messages
      )

      if (!results || results.length === 0) {
        return null
      }

      const [streamName, messages] = results[0]
      return messages.map(([messageId, fields]) => ({ messageId, fields }))
    } catch (error) {
      console.error(`Error reading pending events from stream ${stream}:`, error)
      throw error
    }
  }

  /**
   * Acknowledge a processed event
   */
  async acknowledgeEvent(stream: string, group: string, messageId: string): Promise<number> {
    try {
      const acknowledged = await this.redis.xack(stream, group, messageId)
      console.log(`Acknowledged message ${messageId} in stream ${stream}`)
      return acknowledged
    } catch (error) {
      console.error(`Error acknowledging message ${messageId} in stream ${stream}:`, error)
      throw error
    }
  }

  /**
   * Get stream information
   */
  async getStreamInfo(stream: string): Promise<any> {
    try {
      return await this.redis.xinfo('STREAM', stream)
    } catch (error) {
      console.error(`Error getting stream info for ${stream}:`, error)
      throw error
    }
  }

  /**
   * Get consumer group information
   */
  async getConsumerGroupInfo(stream: string, group: string): Promise<any> {
    try {
      const groups = await this.redis.xinfo('GROUPS', stream)
      return groups.find((g: any) => g.name === group)
    } catch (error) {
      console.error(`Error getting consumer group info for ${group} in stream ${stream}:`, error)
      throw error
    }
  }

  /**
   * Close the Redis connection
   */
  async disconnect(): Promise<void> {
    await this.redis.disconnect()
  }
}

// Export default Redis instance and stream client
export const streamClient = new RedisStreamClient(redis)
export default redis 