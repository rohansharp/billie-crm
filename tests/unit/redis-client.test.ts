import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { RedisStreamClient } from '../../src/server/redis-client'
import { MockRedis } from '../utils/mocks/redis-mock'

describe('RedisStreamClient', () => {
  let redisStreamClient: RedisStreamClient
  let mockRedis: MockRedis

  beforeEach(() => {
    mockRedis = new MockRedis()
    redisStreamClient = new RedisStreamClient(mockRedis as any)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('createConsumerGroup', () => {
    test('should create a new consumer group successfully', async () => {
      mockRedis.xgroup.mockResolvedValue('OK')

      await redisStreamClient.createConsumerGroup('test-stream', 'test-group')

      expect(mockRedis.xgroup).toHaveBeenCalledWith(
        'CREATE',
        'test-stream', 
        'test-group',
        '0',
        'MKSTREAM'
      )
    })

    test('should handle existing consumer group gracefully', async () => {
      const error = new Error('BUSYGROUP Consumer Group name already exists')
      mockRedis.xgroup.mockRejectedValue(error)

      // Should not throw
      await expect(
        redisStreamClient.createConsumerGroup('test-stream', 'test-group')
      ).resolves.toBeUndefined()

      expect(mockRedis.xgroup).toHaveBeenCalledOnce()
    })

    test('should throw on other errors', async () => {
      const error = new Error('Redis connection failed')
      mockRedis.xgroup.mockRejectedValue(error)

      await expect(
        redisStreamClient.createConsumerGroup('test-stream', 'test-group')
      ).rejects.toThrow('Redis connection failed')
    })
  })

  describe('addEvent', () => {
    test('should add event to stream with correct format', async () => {
      const messageId = '1234567890-0'
      mockRedis.xadd.mockResolvedValue(messageId)

      const event = {
        agt: 'broker',
        typ: 'test_event',
        cid: 'conv-123',
        dat: { message: 'test' }
      }

      const result = await redisStreamClient.addEvent('test-stream', event)

      expect(result).toBe(messageId)
      expect(mockRedis.xadd).toHaveBeenCalledWith(
        'test-stream',
        '*',
        'agt', 'broker',
        'typ', 'test_event',
        'cid', 'conv-123',
        'dat', '{"message":"test"}'
      )
    })

    test('should handle string values correctly', async () => {
      const messageId = '1234567890-0'
      mockRedis.xadd.mockResolvedValue(messageId)

      const event = {
        agt: 'broker',
        typ: 'test_event',
        count: 42
      }

      await redisStreamClient.addEvent('test-stream', event)

      expect(mockRedis.xadd).toHaveBeenCalledWith(
        'test-stream',
        '*',
        'agt', 'broker',
        'typ', 'test_event',
        'count', '42'
      )
    })
  })

  describe('readEvents', () => {
    test('should read events from stream successfully', async () => {
      const mockResponse = [
        ['test-stream', [
          ['1234567890-0', ['agt', 'broker', 'typ', 'test_event']]
        ]]
      ]
      mockRedis.xreadgroup.mockResolvedValue(mockResponse)

      const result = await redisStreamClient.readEvents(
        'test-stream',
        'test-group', 
        'test-consumer'
      )

      expect(result).toEqual([
        {
          messageId: '1234567890-0',
          fields: ['agt', 'broker', 'typ', 'test_event']
        }
      ])

      expect(mockRedis.xreadgroup).toHaveBeenCalledWith(
        'GROUP',
        'test-group',
        'test-consumer',
        'COUNT',
        10,
        'BLOCK',
        1000,
        'STREAMS',
        'test-stream',
        '>'
      )
    })

    test('should return null when no events available', async () => {
      mockRedis.xreadgroup.mockResolvedValue(null)

      const result = await redisStreamClient.readEvents(
        'test-stream',
        'test-group',
        'test-consumer'
      )

      expect(result).toBeNull()
    })
  })

  describe('readPendingEvents', () => {
    test('should read pending events correctly', async () => {
      const mockResponse = [
        ['test-stream', [
          ['1234567890-0', ['agt', 'broker', 'typ', 'pending_event']]
        ]]
      ]
      mockRedis.xreadgroup.mockResolvedValue(mockResponse)

      const result = await redisStreamClient.readPendingEvents(
        'test-stream',
        'test-group',
        'test-consumer'
      )

      expect(result).toEqual([
        {
          messageId: '1234567890-0',
          fields: ['agt', 'broker', 'typ', 'pending_event']
        }
      ])

      expect(mockRedis.xreadgroup).toHaveBeenCalledWith(
        'GROUP',
        'test-group',
        'test-consumer',
        'COUNT',
        100,
        'STREAMS',
        'test-stream',
        '0' // Important: '0' for pending messages
      )
    })
  })

  describe('acknowledgeEvent', () => {
    test('should acknowledge event successfully', async () => {
      mockRedis.xack.mockResolvedValue(1)

      const result = await redisStreamClient.acknowledgeEvent(
        'test-stream',
        'test-group',
        '1234567890-0'
      )

      expect(result).toBe(1)
      expect(mockRedis.xack).toHaveBeenCalledWith(
        'test-stream',
        'test-group',
        '1234567890-0'
      )
    })
  })

  describe('getStreamInfo', () => {
    test('should get stream information', async () => {
      const mockStreamInfo = { length: 10, 'first-entry': [], 'last-entry': [] }
      mockRedis.xinfo.mockResolvedValue(mockStreamInfo)

      const result = await redisStreamClient.getStreamInfo('test-stream')

      expect(result).toBe(mockStreamInfo)
      expect(mockRedis.xinfo).toHaveBeenCalledWith('STREAM', 'test-stream')
    })
  })

  describe('getConsumerGroupInfo', () => {
    test('should get consumer group information', async () => {
      const mockGroups = [
        { name: 'test-group', consumers: 1, pending: 0 },
        { name: 'other-group', consumers: 2, pending: 5 }
      ]
      mockRedis.xinfo.mockResolvedValue(mockGroups)

      const result = await redisStreamClient.getConsumerGroupInfo(
        'test-stream',
        'test-group'
      )

      expect(result).toEqual({ name: 'test-group', consumers: 1, pending: 0 })
      expect(mockRedis.xinfo).toHaveBeenCalledWith('GROUPS', 'test-stream')
    })

    test('should return undefined if group not found', async () => {
      const mockGroups = [
        { name: 'other-group', consumers: 2, pending: 5 }
      ]
      mockRedis.xinfo.mockResolvedValue(mockGroups)

      const result = await redisStreamClient.getConsumerGroupInfo(
        'test-stream',
        'non-existent-group'
      )

      expect(result).toBeUndefined()
    })
  })

  describe('disconnect', () => {
    test('should disconnect from Redis', async () => {
      mockRedis.disconnect.mockResolvedValue(undefined)

      await redisStreamClient.disconnect()

      expect(mockRedis.disconnect).toHaveBeenCalledOnce()
    })
  })
})