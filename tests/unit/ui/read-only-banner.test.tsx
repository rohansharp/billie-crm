import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import React from 'react'
import { ReadOnlyBanner } from '@/components/ReadOnlyBanner'
import { useUIStore } from '@/stores/ui'

describe('ReadOnlyBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset store state
    useUIStore.setState({ readOnlyMode: false })
  })

  afterEach(() => {
    cleanup()
  })

  describe('Visibility', () => {
    it('should not render when readOnlyMode is false', () => {
      useUIStore.setState({ readOnlyMode: false })
      render(<ReadOnlyBanner />)

      expect(screen.queryByTestId('read-only-banner')).not.toBeInTheDocument()
    })

    it('should render when readOnlyMode is true', () => {
      useUIStore.setState({ readOnlyMode: true })
      render(<ReadOnlyBanner />)

      expect(screen.getByTestId('read-only-banner')).toBeInTheDocument()
    })
  })

  describe('Content', () => {
    it('should show default message', () => {
      useUIStore.setState({ readOnlyMode: true })
      render(<ReadOnlyBanner />)

      expect(screen.getByText('System in read-only mode')).toBeInTheDocument()
    })

    it('should show default subtext', () => {
      useUIStore.setState({ readOnlyMode: true })
      render(<ReadOnlyBanner />)

      expect(
        screen.getByText('Write operations temporarily unavailable.')
      ).toBeInTheDocument()
    })

    it('should show custom message when provided', () => {
      useUIStore.setState({ readOnlyMode: true })
      render(<ReadOnlyBanner message="Custom offline message" />)

      expect(screen.getByText('Custom offline message')).toBeInTheDocument()
    })

    it('should show custom subtext when provided', () => {
      useUIStore.setState({ readOnlyMode: true })
      render(<ReadOnlyBanner subtext="Custom subtext here" />)

      expect(screen.getByText('Custom subtext here')).toBeInTheDocument()
    })

    it('should show lock icon', () => {
      useUIStore.setState({ readOnlyMode: true })
      render(<ReadOnlyBanner />)

      expect(screen.getByText('🔒')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have role="alert"', () => {
      useUIStore.setState({ readOnlyMode: true })
      render(<ReadOnlyBanner />)

      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('should have aria-live="assertive"', () => {
      useUIStore.setState({ readOnlyMode: true })
      render(<ReadOnlyBanner />)

      expect(screen.getByTestId('read-only-banner')).toHaveAttribute(
        'aria-live',
        'assertive'
      )
    })
  })

  describe('State Updates', () => {
    it('should appear when readOnlyMode changes to true', () => {
      useUIStore.setState({ readOnlyMode: false })
      const { rerender } = render(<ReadOnlyBanner />)

      expect(screen.queryByTestId('read-only-banner')).not.toBeInTheDocument()

      // Update store state
      useUIStore.setState({ readOnlyMode: true })
      rerender(<ReadOnlyBanner />)

      expect(screen.getByTestId('read-only-banner')).toBeInTheDocument()
    })

    it('should disappear when readOnlyMode changes to false', () => {
      useUIStore.setState({ readOnlyMode: true })
      const { rerender } = render(<ReadOnlyBanner />)

      expect(screen.getByTestId('read-only-banner')).toBeInTheDocument()

      // Update store state
      useUIStore.setState({ readOnlyMode: false })
      rerender(<ReadOnlyBanner />)

      expect(screen.queryByTestId('read-only-banner')).not.toBeInTheDocument()
    })
  })
})
