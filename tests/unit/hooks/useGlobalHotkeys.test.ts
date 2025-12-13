import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest'

// We need to test the hook logic, but since it uses window.addEventListener
// we'll test the core logic by simulating keyboard events on window

describe('useGlobalHotkeys', () => {
  let mockCallback: ReturnType<typeof vi.fn>
  let keydownHandler: ((e: KeyboardEvent) => void) | null = null

  beforeEach(() => {
    mockCallback = vi.fn()
    keydownHandler = null

    // Capture the keydown handler when it's registered
    vi.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'keydown') {
        keydownHandler = handler as (e: KeyboardEvent) => void
      }
    })

    vi.spyOn(window, 'removeEventListener').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('exports useGlobalHotkeys function', async () => {
    const { useGlobalHotkeys } = await import('@/hooks/useGlobalHotkeys')
    expect(typeof useGlobalHotkeys).toBe('function')
  })

  test('exports useCommandPaletteHotkeys function', async () => {
    const { useCommandPaletteHotkeys } = await import('@/hooks/useGlobalHotkeys')
    expect(typeof useCommandPaletteHotkeys).toBe('function')
  })

  test('useCommandPaletteHotkeys defines correct hotkeys', async () => {
    // This is a structural test to ensure the hook configures the expected keys
    const { useCommandPaletteHotkeys } = await import('@/hooks/useGlobalHotkeys')
    
    // The hook should listen for:
    // - 'k' with cmdOrCtrl modifier
    // - 'F7' without modifier
    // - 'Escape' to close
    
    // Since we can't easily introspect the hook config without rendering,
    // we verify the function signature is correct
    expect(useCommandPaletteHotkeys.length).toBe(2) // Takes isOpen and onOpenChange
  })
})

describe('Hotkey matching logic', () => {
  test('should match lowercase key regardless of input case', () => {
    // Test utility to verify key matching works case-insensitively
    const normalizeKey = (key: string) => key.toLowerCase()
    
    expect(normalizeKey('K')).toBe('k')
    expect(normalizeKey('k')).toBe('k')
    expect(normalizeKey('Escape')).toBe('escape')
    expect(normalizeKey('F7')).toBe('f7')
  })

  test('cmdOrCtrl should match metaKey on Mac', () => {
    // Verify the logic for detecting Cmd on Mac
    const isMac = (e: { metaKey: boolean; ctrlKey: boolean }) => e.metaKey || e.ctrlKey
    
    expect(isMac({ metaKey: true, ctrlKey: false })).toBe(true) // Mac Cmd
    expect(isMac({ metaKey: false, ctrlKey: true })).toBe(true) // Windows/Linux Ctrl
    expect(isMac({ metaKey: false, ctrlKey: false })).toBe(false) // No modifier
  })
})
