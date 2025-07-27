import { vi } from 'vitest'

export class MockRedis {
  // Stream commands
  xgroup = vi.fn()
  xadd = vi.fn()
  xreadgroup = vi.fn()
  xack = vi.fn()
  xinfo = vi.fn()
  
  // Basic commands
  ping = vi.fn()
  disconnect = vi.fn()
  
  // Pub/Sub commands
  publish = vi.fn()
  subscribe = vi.fn()
  unsubscribe = vi.fn()
  
  // General commands
  get = vi.fn()
  set = vi.fn()
  del = vi.fn()
  exists = vi.fn()
  
  // Key expiration
  expire = vi.fn()
  ttl = vi.fn()
  
  // List commands (for dead letter queue)
  lpush = vi.fn()
  rpop = vi.fn()
  llen = vi.fn()
  
  // Hash commands
  hset = vi.fn()
  hget = vi.fn()
  hgetall = vi.fn()
  hdel = vi.fn()
  
  constructor() {
    // Set up default successful responses
    this.ping.mockResolvedValue('PONG')
    this.disconnect.mockResolvedValue(undefined)
    this.xgroup.mockResolvedValue('OK')
    this.xadd.mockResolvedValue('1234567890-0')
    this.xack.mockResolvedValue(1)
    this.publish.mockResolvedValue(1)
  }
  
  // Helper method to reset all mocks
  resetMocks() {
    Object.values(this).forEach(method => {
      if (typeof method === 'function' && 'mockReset' in method) {
        method.mockReset()
      }
    })
  }
} 