// Any setup scripts you might need go here

// Load .env files
import 'dotenv/config'

// Add testing-library jest-dom matchers
import '@testing-library/jest-dom/vitest'

// Mock ResizeObserver for tests (not available in JSDOM)
// Required by cmdk and other resize-aware libraries
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
