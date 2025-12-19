import { describe, test, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { ContextDrawer } from '@/components/ui/ContextDrawer'

describe('ContextDrawer component', () => {
  afterEach(() => {
    cleanup()
    document.body.style.overflow = ''
  })

  test('renders when isOpen is true', () => {
    render(
      <ContextDrawer isOpen={true} onClose={vi.fn()} title="Test Drawer">
        <p>Content</p>
      </ContextDrawer>
    )
    expect(screen.getByTestId('context-drawer')).toBeInTheDocument()
  })

  test('does not render when isOpen is false', () => {
    render(
      <ContextDrawer isOpen={false} onClose={vi.fn()} title="Test Drawer">
        <p>Content</p>
      </ContextDrawer>
    )
    expect(screen.queryByTestId('context-drawer')).not.toBeInTheDocument()
  })

  test('renders title', () => {
    render(
      <ContextDrawer isOpen={true} onClose={vi.fn()} title="Account Details">
        <p>Content</p>
      </ContextDrawer>
    )
    expect(screen.getByText('Account Details')).toBeInTheDocument()
  })

  test('renders children', () => {
    render(
      <ContextDrawer isOpen={true} onClose={vi.fn()} title="Test">
        <p>Test content here</p>
      </ContextDrawer>
    )
    expect(screen.getByText('Test content here')).toBeInTheDocument()
  })

  test('calls onClose when close button clicked', () => {
    const onClose = vi.fn()
    render(
      <ContextDrawer isOpen={true} onClose={onClose} title="Test">
        <p>Content</p>
      </ContextDrawer>
    )
    
    fireEvent.click(screen.getByTestId('context-drawer-close'))
    expect(onClose).toHaveBeenCalled()
  })

  test('calls onClose when overlay clicked', () => {
    const onClose = vi.fn()
    render(
      <ContextDrawer isOpen={true} onClose={onClose} title="Test">
        <p>Content</p>
      </ContextDrawer>
    )
    
    fireEvent.click(screen.getByTestId('context-drawer-overlay'))
    expect(onClose).toHaveBeenCalled()
  })

  test('does not call onClose when drawer content clicked', () => {
    const onClose = vi.fn()
    render(
      <ContextDrawer isOpen={true} onClose={onClose} title="Test">
        <p>Content</p>
      </ContextDrawer>
    )
    
    fireEvent.click(screen.getByTestId('context-drawer'))
    expect(onClose).not.toHaveBeenCalled()
  })

  test('has role="dialog" for accessibility', () => {
    render(
      <ContextDrawer isOpen={true} onClose={vi.fn()} title="Test">
        <p>Content</p>
      </ContextDrawer>
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  test('has aria-modal="true"', () => {
    render(
      <ContextDrawer isOpen={true} onClose={vi.fn()} title="Test">
        <p>Content</p>
      </ContextDrawer>
    )
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })

  test('close button has aria-label', () => {
    render(
      <ContextDrawer isOpen={true} onClose={vi.fn()} title="Test">
        <p>Content</p>
      </ContextDrawer>
    )
    expect(screen.getByTestId('context-drawer-close')).toHaveAttribute('aria-label', 'Close drawer')
  })

  test('calls onClose when Escape key pressed', () => {
    const onClose = vi.fn()
    render(
      <ContextDrawer isOpen={true} onClose={onClose} title="Test">
        <p>Content</p>
      </ContextDrawer>
    )
    
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  test('sets body overflow to hidden when open', () => {
    render(
      <ContextDrawer isOpen={true} onClose={vi.fn()} title="Test">
        <p>Content</p>
      </ContextDrawer>
    )
    expect(document.body.style.overflow).toBe('hidden')
  })
})
