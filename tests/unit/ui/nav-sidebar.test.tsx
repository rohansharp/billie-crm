import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// Mock next/navigation
const mockUsePathname = vi.fn()
vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}))

// Mock @payloadcms/ui
const mockUseAuth = vi.fn()
vi.mock('@payloadcms/ui', () => ({
  useAuth: () => mockUseAuth(),
}))

// Mock stores
const mockSetCommandPaletteOpen = vi.fn()
vi.mock('@/stores/ui', () => ({
  useUIStore: (selector: (s: { setCommandPaletteOpen: typeof mockSetCommandPaletteOpen }) => unknown) =>
    selector({ setCommandPaletteOpen: mockSetCommandPaletteOpen }),
}))

// Import components after mocks
import { NavSearchTrigger } from '@/components/navigation/NavSearchTrigger'
import { NavDashboardLink } from '@/components/navigation/NavDashboardLink'
import { NavApprovalsLink } from '@/components/navigation/NavApprovalsLink'
import { NavSystemStatus } from '@/components/navigation/NavSystemStatus'

// Create query client wrapper for components that need React Query
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

const mockConnectedResponse = {
  status: 'connected',
  latencyMs: 150,
  message: 'Ledger Connected',
  checkedAt: '2025-12-11T10:00:00Z',
}

const mockDegradedResponse = {
  status: 'degraded',
  latencyMs: 2500,
  message: 'Ledger Degraded',
  checkedAt: '2025-12-11T10:00:00Z',
}

const mockOfflineResponse = {
  status: 'offline',
  latencyMs: 0,
  message: 'Ledger Offline',
  checkedAt: '2025-12-11T10:00:00Z',
}

const mockPendingApprovalsResponse = {
  docs: [],
  totalDocs: 5,
  limit: 1,
  page: 1,
  totalPages: 5,
  hasNextPage: true,
  hasPrevPage: false,
}

function setupMockFetch(responses: Record<string, unknown> = {}) {
  ;(global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
    if (url.includes('/api/ledger/health')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(responses.health ?? mockConnectedResponse),
      })
    }
    if (url.includes('/api/write-off-requests')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(responses.approvals ?? mockPendingApprovalsResponse),
      })
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
    })
  })
}

describe('NavSearchTrigger', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock navigator.platform for consistent testing
    Object.defineProperty(navigator, 'platform', {
      value: 'MacIntel',
      configurable: true,
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('should render search button with icon and label', () => {
    render(<NavSearchTrigger />)

    expect(screen.getByRole('button', { name: /open search/i })).toBeInTheDocument()
    expect(screen.getByText('Search')).toBeInTheDocument()
    expect(screen.getByText('🔍')).toBeInTheDocument()
  })

  it('should show Mac keyboard shortcut on Mac', async () => {
    Object.defineProperty(navigator, 'platform', {
      value: 'MacIntel',
      configurable: true,
    })

    render(<NavSearchTrigger />)

    // After useEffect runs, should show Mac shortcut
    await waitFor(() => {
      expect(screen.getByText('⌘K')).toBeInTheDocument()
    })
  })

  it('should show Windows keyboard shortcut on Windows', async () => {
    Object.defineProperty(navigator, 'platform', {
      value: 'Win32',
      configurable: true,
    })

    render(<NavSearchTrigger />)

    // After useEffect runs, should show Windows shortcut
    await waitFor(() => {
      expect(screen.getByText('Ctrl+K')).toBeInTheDocument()
    })
  })

  it('should open command palette when clicked (AC3)', () => {
    render(<NavSearchTrigger />)

    const button = screen.getByRole('button', { name: /open search/i })
    fireEvent.click(button)

    expect(mockSetCommandPaletteOpen).toHaveBeenCalledWith(true)
  })

  it('should be keyboard accessible', () => {
    render(<NavSearchTrigger />)

    const button = screen.getByRole('button', { name: /open search/i })
    expect(button).toHaveAttribute('type', 'button')
  })
})

describe('NavDashboardLink', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUsePathname.mockReturnValue('/admin/customers')
  })

  afterEach(() => {
    cleanup()
  })

  it('should render dashboard link with icon and label', () => {
    render(<NavDashboardLink />)

    const link = screen.getByRole('link', { name: /dashboard/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/admin/dashboard')
    expect(screen.getByText('🏠')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('should navigate to /admin/dashboard when clicked (AC4)', () => {
    render(<NavDashboardLink />)

    const link = screen.getByRole('link', { name: /dashboard/i })
    expect(link).toHaveAttribute('href', '/admin/dashboard')
  })

  it('should mark as active when on dashboard page', () => {
    mockUsePathname.mockReturnValue('/admin/dashboard')

    render(<NavDashboardLink />)

    const link = screen.getByRole('link', { name: /dashboard/i })
    expect(link).toHaveAttribute('aria-current', 'page')
  })

  it('should not mark as active when on other pages', () => {
    mockUsePathname.mockReturnValue('/admin/customers')

    render(<NavDashboardLink />)

    const link = screen.getByRole('link', { name: /dashboard/i })
    expect(link).not.toHaveAttribute('aria-current')
  })
})

describe('NavApprovalsLink', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
    mockUsePathname.mockReturnValue('/admin/customers')
    mockUseAuth.mockReturnValue({ user: { role: 'supervisor' } })
  })

  afterEach(() => {
    cleanup()
  })

  describe('RBAC - Role-based visibility (AC6)', () => {
    it('should render for users with supervisor role', () => {
      mockUseAuth.mockReturnValue({ user: { role: 'supervisor' } })
      setupMockFetch()

      render(<NavApprovalsLink />, { wrapper: createWrapper() })

      expect(screen.getByRole('link', { name: /approvals/i })).toBeInTheDocument()
    })

    it('should render for users with admin role', () => {
      mockUseAuth.mockReturnValue({ user: { role: 'admin' } })
      setupMockFetch()

      render(<NavApprovalsLink />, { wrapper: createWrapper() })

      expect(screen.getByRole('link', { name: /approvals/i })).toBeInTheDocument()
    })

    it('should NOT render for users with operations role', () => {
      mockUseAuth.mockReturnValue({ user: { role: 'operations' } })
      setupMockFetch()

      render(<NavApprovalsLink />, { wrapper: createWrapper() })

      expect(screen.queryByRole('link', { name: /approvals/i })).not.toBeInTheDocument()
    })

    it('should NOT render for users with readonly role', () => {
      mockUseAuth.mockReturnValue({ user: { role: 'readonly' } })
      setupMockFetch()

      render(<NavApprovalsLink />, { wrapper: createWrapper() })

      expect(screen.queryByRole('link', { name: /approvals/i })).not.toBeInTheDocument()
    })

    it('should NOT render when user is undefined', () => {
      mockUseAuth.mockReturnValue({ user: undefined })
      setupMockFetch()

      render(<NavApprovalsLink />, { wrapper: createWrapper() })

      expect(screen.queryByRole('link', { name: /approvals/i })).not.toBeInTheDocument()
    })
  })

  describe('Navigation (AC5)', () => {
    it('should link to /admin/approvals', () => {
      mockUseAuth.mockReturnValue({ user: { role: 'supervisor' } })
      setupMockFetch()

      render(<NavApprovalsLink />, { wrapper: createWrapper() })

      const link = screen.getByRole('link', { name: /approvals/i })
      expect(link).toHaveAttribute('href', '/admin/approvals')
    })

    it('should mark as active when on approvals page', () => {
      mockUseAuth.mockReturnValue({ user: { role: 'supervisor' } })
      mockUsePathname.mockReturnValue('/admin/approvals')
      setupMockFetch()

      render(<NavApprovalsLink />, { wrapper: createWrapper() })

      const link = screen.getByRole('link', { name: /approvals/i })
      expect(link).toHaveAttribute('aria-current', 'page')
    })
  })

  describe('Badge - Pending count (AC2)', () => {
    it('should show badge with pending count', async () => {
      mockUseAuth.mockReturnValue({ user: { role: 'supervisor' } })
      setupMockFetch({ approvals: { ...mockPendingApprovalsResponse, totalDocs: 3 } })

      render(<NavApprovalsLink />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument()
      })
    })

    it('should show 99+ when count exceeds 99', async () => {
      mockUseAuth.mockReturnValue({ user: { role: 'supervisor' } })
      setupMockFetch({ approvals: { ...mockPendingApprovalsResponse, totalDocs: 150 } })

      render(<NavApprovalsLink />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByText('99+')).toBeInTheDocument()
      })
    })

    it('should not show badge when count is 0', async () => {
      mockUseAuth.mockReturnValue({ user: { role: 'supervisor' } })
      setupMockFetch({ approvals: { ...mockPendingApprovalsResponse, totalDocs: 0 } })

      render(<NavApprovalsLink />, { wrapper: createWrapper() })

      // Wait for the query to complete
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      // Then verify no badge is present
      expect(screen.queryByText('0')).not.toBeInTheDocument()
    })

    it('should have aria-label for pending count', async () => {
      mockUseAuth.mockReturnValue({ user: { role: 'supervisor' } })
      setupMockFetch({ approvals: { ...mockPendingApprovalsResponse, totalDocs: 5 } })

      render(<NavApprovalsLink />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByLabelText('5 pending approvals')).toBeInTheDocument()
      })
    })
  })
})

describe('NavSystemStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  afterEach(() => {
    cleanup()
  })

  it('should show loading state initially', () => {
    setupMockFetch({ health: mockConnectedResponse })

    render(<NavSystemStatus />, { wrapper: createWrapper() })

    expect(screen.getByText('Checking...')).toBeInTheDocument()
  })

  describe('Connected state (AC7)', () => {
    it('should show "Online" label when connected', async () => {
      setupMockFetch({ health: mockConnectedResponse })

      render(<NavSystemStatus />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByText('Online')).toBeInTheDocument()
      })
    })

    it('should show green status icon', async () => {
      setupMockFetch({ health: mockConnectedResponse })

      render(<NavSystemStatus />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByText('🟢')).toBeInTheDocument()
      })
    })

    it('should show latency when connected', async () => {
      setupMockFetch({ health: mockConnectedResponse })

      render(<NavSystemStatus />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByText('(150ms)')).toBeInTheDocument()
      })
    })
  })

  describe('Degraded state', () => {
    it('should show "Degraded" label when degraded', async () => {
      setupMockFetch({ health: mockDegradedResponse })

      render(<NavSystemStatus />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByText('Degraded')).toBeInTheDocument()
      })
    })

    it('should show yellow status icon', async () => {
      setupMockFetch({ health: mockDegradedResponse })

      render(<NavSystemStatus />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByText('🟡')).toBeInTheDocument()
      })
    })
  })

  describe('Offline state', () => {
    it('should show "Offline" label when offline', async () => {
      setupMockFetch({ health: mockOfflineResponse })

      render(<NavSystemStatus />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByText('Offline')).toBeInTheDocument()
      })
    })

    it('should show red status icon', async () => {
      setupMockFetch({ health: mockOfflineResponse })

      render(<NavSystemStatus />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByText('🔴')).toBeInTheDocument()
      })
    })
  })

  it('should have aria-live for accessibility', async () => {
    setupMockFetch({ health: mockConnectedResponse })

    render(<NavSystemStatus />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
    })
  })
})
