import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { CommandPalette } from '@/components/ui/CommandPalette'
import { useUIStore } from '@/stores/ui'

describe('CommandPalette component', () => {
  const createProps = () => ({
    isOpen: true,
    onOpenChange: vi.fn(),
    query: '',
    onQueryChange: vi.fn(),
    isSearching: false,
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  test('renders when isOpen is true', () => {
    render(<CommandPalette {...createProps()} />)
    
    expect(screen.getByTestId('command-palette-overlay')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByTestId('command-palette-input')).toBeInTheDocument()
  })

  test('does not render when isOpen is false', () => {
    render(<CommandPalette {...createProps()} isOpen={false} />)
    
    expect(screen.queryByTestId('command-palette-overlay')).not.toBeInTheDocument()
  })

  test('calls onOpenChange(false) when clicking overlay', () => {
    const props = createProps()
    render(<CommandPalette {...props} />)
    
    fireEvent.click(screen.getByTestId('command-palette-overlay'))
    
    expect(props.onOpenChange).toHaveBeenCalledWith(false)
  })

  test('calls onOpenChange(false) when pressing Escape', () => {
    const props = createProps()
    const { container } = render(<CommandPalette {...props} />)
    
    // The Command component (with [cmdk-root] attribute) handles the keydown
    const cmdkRoot = container.querySelector('[cmdk-root]')
    expect(cmdkRoot).not.toBeNull()
    fireEvent.keyDown(cmdkRoot!, { key: 'Escape' })
    
    expect(props.onOpenChange).toHaveBeenCalledWith(false)
  })

  test('calls onQueryChange when typing in input', () => {
    const props = createProps()
    render(<CommandPalette {...props} />)
    
    const input = screen.getByTestId('command-palette-input')
    fireEvent.change(input, { target: { value: 'test query' } })
    
    expect(props.onQueryChange).toHaveBeenCalledWith('test query')
  })

  test('shows loading indicator when isSearching is true', () => {
    render(<CommandPalette {...createProps()} isSearching={true} />)
    
    expect(screen.getByTestId('command-palette-loading')).toBeInTheDocument()
    expect(screen.getByText('Searching...')).toBeInTheDocument()
  })

  test('shows empty state when query is empty and not searching', () => {
    render(<CommandPalette {...createProps()} query="" isSearching={false} />)
    
    expect(screen.getByText('Start typing to search...')).toBeInTheDocument()
  })

  test('shows no results message when query has value but no children', () => {
    render(<CommandPalette {...createProps()} query="nonexistent" isSearching={false} />)
    
    expect(screen.getByText(/No results found for/)).toBeInTheDocument()
    expect(screen.getByText(/nonexistent/)).toBeInTheDocument()
  })

  test('renders children (results) when provided', () => {
    render(
      <CommandPalette {...createProps()} query="test">
        <div data-testid="search-result">Result Item</div>
      </CommandPalette>
    )
    
    expect(screen.getByTestId('search-result')).toBeInTheDocument()
  })

  test('shows keyboard hints in footer', () => {
    const { container } = render(<CommandPalette {...createProps()} />)
    
    // Footer should contain keyboard hint text
    const footer = container.querySelector('[class*="footer"]')
    expect(footer).not.toBeNull()
    expect(footer?.textContent).toContain('navigate')
    expect(footer?.textContent).toContain('select')
    expect(footer?.textContent).toContain('close')
  })
})

describe('useUIStore command palette state', () => {
  beforeEach(() => {
    useUIStore.setState({
      commandPaletteOpen: false,
      commandPaletteQuery: '',
    })
  })

  test('setCommandPaletteOpen updates open state', () => {
    const { setCommandPaletteOpen, commandPaletteOpen } = useUIStore.getState()
    expect(commandPaletteOpen).toBe(false)
    
    setCommandPaletteOpen(true)
    
    expect(useUIStore.getState().commandPaletteOpen).toBe(true)
  })

  test('setCommandPaletteQuery updates query', () => {
    const { setCommandPaletteQuery } = useUIStore.getState()
    
    setCommandPaletteQuery('customer search')
    
    expect(useUIStore.getState().commandPaletteQuery).toBe('customer search')
  })

  test('opening palette resets query', () => {
    useUIStore.setState({ commandPaletteQuery: 'previous query' })
    
    const { setCommandPaletteOpen } = useUIStore.getState()
    setCommandPaletteOpen(true)
    
    // Query should be reset when opening
    expect(useUIStore.getState().commandPaletteQuery).toBe('')
  })
})

// Note: Full keyboard event simulation for global hotkeys (Cmd+K, F7)
// requires window.addEventListener integration which is covered in e2e tests.
// Unit tests for the hook logic are in tests/unit/hooks/useGlobalHotkeys.test.ts
