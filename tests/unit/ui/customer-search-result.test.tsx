import { describe, test, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { CustomerSearchResult } from '@/components/ui/CommandPalette/CustomerSearchResult'
import { Command } from 'cmdk'

// Wrap component in Command context for cmdk
const CommandWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Command>
      <Command.List>{children}</Command.List>
    </Command>
  )
}

describe('CustomerSearchResult component', () => {
  const mockCustomer = {
    id: 'cust-1',
    customerId: 'CUS-12345',
    fullName: 'John Smith',
    emailAddress: 'john.smith@example.com',
    identityVerified: true,
    accountCount: 2,
  }

  const createProps = (overrides = {}) => ({
    customer: { ...mockCustomer, ...overrides },
    onSelect: vi.fn(),
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  test('renders customer name', () => {
    const props = createProps()
    render(
      <CommandWrapper>
        <CustomerSearchResult {...props} />
      </CommandWrapper>
    )

    expect(screen.getByText('John Smith')).toBeInTheDocument()
  })

  test('renders customer ID', () => {
    const props = createProps()
    render(
      <CommandWrapper>
        <CustomerSearchResult {...props} />
      </CommandWrapper>
    )

    expect(screen.getByText('CUS-12345')).toBeInTheDocument()
  })

  test('renders email address', () => {
    const props = createProps()
    render(
      <CommandWrapper>
        <CustomerSearchResult {...props} />
      </CommandWrapper>
    )

    expect(screen.getByText('john.smith@example.com')).toBeInTheDocument()
  })

  test('renders verified badge when identityVerified is true', () => {
    const props = createProps({ identityVerified: true })
    render(
      <CommandWrapper>
        <CustomerSearchResult {...props} />
      </CommandWrapper>
    )

    expect(screen.getByText('Verified')).toBeInTheDocument()
  })

  test('does not render verified badge when identityVerified is false', () => {
    const props = createProps({ identityVerified: false })
    render(
      <CommandWrapper>
        <CustomerSearchResult {...props} />
      </CommandWrapper>
    )

    expect(screen.queryByText('Verified')).not.toBeInTheDocument()
  })

  test('renders account count with plural form', () => {
    const props = createProps({ accountCount: 2 })
    render(
      <CommandWrapper>
        <CustomerSearchResult {...props} />
      </CommandWrapper>
    )

    expect(screen.getByText('2 accounts')).toBeInTheDocument()
  })

  test('renders account count with singular form', () => {
    const props = createProps({ accountCount: 1 })
    render(
      <CommandWrapper>
        <CustomerSearchResult {...props} />
      </CommandWrapper>
    )

    expect(screen.getByText('1 account')).toBeInTheDocument()
  })

  test('renders zero accounts correctly', () => {
    const props = createProps({ accountCount: 0 })
    render(
      <CommandWrapper>
        <CustomerSearchResult {...props} />
      </CommandWrapper>
    )

    expect(screen.getByText('0 accounts')).toBeInTheDocument()
  })

  test('renders "Unknown" when fullName is null', () => {
    const props = createProps({ fullName: null })
    render(
      <CommandWrapper>
        <CustomerSearchResult {...props} />
      </CommandWrapper>
    )

    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })

  test('renders "No email" when emailAddress is null', () => {
    const props = createProps({ emailAddress: null })
    render(
      <CommandWrapper>
        <CustomerSearchResult {...props} />
      </CommandWrapper>
    )

    expect(screen.getByText('No email')).toBeInTheDocument()
  })

  test('has correct test id', () => {
    const props = createProps()
    render(
      <CommandWrapper>
        <CustomerSearchResult {...props} />
      </CommandWrapper>
    )

    expect(screen.getByTestId('customer-result-CUS-12345')).toBeInTheDocument()
  })

  test('renders user icon', () => {
    const props = createProps()
    const { container } = render(
      <CommandWrapper>
        <CustomerSearchResult {...props} />
      </CommandWrapper>
    )

    // Check SVG icon is present
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
  })
})
