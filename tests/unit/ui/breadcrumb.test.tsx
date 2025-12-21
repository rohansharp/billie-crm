import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { Breadcrumb, type BreadcrumbItem } from '@/components/Breadcrumb'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

// Clean up after each test
beforeEach(() => {
  cleanup()
})

describe('Breadcrumb', () => {
  describe('Rendering', () => {
    it('should not render when items array is empty (AC1)', () => {
      render(<Breadcrumb items={[]} />)
      expect(screen.queryByTestId('breadcrumb')).not.toBeInTheDocument()
    })

    it('should render home icon and single item (AC3)', () => {
      render(<Breadcrumb items={[{ label: 'Approvals' }]} />)

      expect(screen.getByTestId('breadcrumb')).toBeInTheDocument()
      expect(screen.getByTestId('breadcrumb-home')).toBeInTheDocument()
      expect(screen.getByText('🏠')).toBeInTheDocument()
      expect(screen.getByText('Approvals')).toBeInTheDocument()
    })

    it('should render multiple breadcrumb items (AC2)', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Customer CUST-001' },
        { label: 'John Smith' },
      ]
      render(<Breadcrumb items={items} />)

      expect(screen.getByText('Customer CUST-001')).toBeInTheDocument()
      expect(screen.getByText('John Smith')).toBeInTheDocument()
    })

    it('should render separators between items', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Level 1', href: '/level-1' },
        { label: 'Level 2' },
      ]
      render(<Breadcrumb items={items} />)

      // Should have 2 separators (after home, after level 1)
      const separators = screen.getAllByText('›')
      expect(separators).toHaveLength(2)
    })
  })

  describe('Navigation (AC4)', () => {
    it('should render home link to dashboard', () => {
      render(<Breadcrumb items={[{ label: 'Test' }]} />)

      const homeLink = screen.getByTestId('breadcrumb-home')
      expect(homeLink).toHaveAttribute('href', '/admin/dashboard')
    })

    it('should render links for items with href', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Parent', href: '/admin/parent' },
        { label: 'Current' },
      ]
      render(<Breadcrumb items={items} />)

      const link = screen.getByTestId('breadcrumb-item-0')
      expect(link.tagName).toBe('A')
      expect(link).toHaveAttribute('href', '/admin/parent')
    })
  })

  describe('Current Page Styling (AC5)', () => {
    it('should render last item as current page (not a link)', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Parent', href: '/admin/parent' },
        { label: 'Current Page' },
      ]
      render(<Breadcrumb items={items} />)

      const currentPage = screen.getByTestId('breadcrumb-item-1')
      expect(currentPage.tagName).toBe('SPAN')
      expect(currentPage).toHaveAttribute('aria-current', 'page')
    })

    it('should render single item as current page', () => {
      render(<Breadcrumb items={[{ label: 'Approvals' }]} />)

      const currentPage = screen.getByTestId('breadcrumb-item-0')
      expect(currentPage.tagName).toBe('SPAN')
      expect(currentPage).toHaveAttribute('aria-current', 'page')
    })

    it('should not render items without href as links', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Not a link' }, // No href
      ]
      render(<Breadcrumb items={items} />)

      const item = screen.getByTestId('breadcrumb-item-0')
      expect(item.tagName).toBe('SPAN')
    })

    it('should only apply aria-current to last item', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Parent' }, // No href, but not last
        { label: 'Current' }, // No href, is last
      ]
      render(<Breadcrumb items={items} />)

      const parent = screen.getByTestId('breadcrumb-item-0')
      const current = screen.getByTestId('breadcrumb-item-1')

      expect(parent).not.toHaveAttribute('aria-current')
      expect(current).toHaveAttribute('aria-current', 'page')
    })
  })

  describe('Accessibility', () => {
    it('should have proper aria-label on nav', () => {
      render(<Breadcrumb items={[{ label: 'Test' }]} />)

      const nav = screen.getByRole('navigation')
      expect(nav).toHaveAttribute('aria-label', 'Breadcrumb navigation')
    })

    it('should have aria-label on home link', () => {
      render(<Breadcrumb items={[{ label: 'Test' }]} />)

      const homeLink = screen.getByTestId('breadcrumb-home')
      expect(homeLink).toHaveAttribute('aria-label', 'Go to dashboard')
    })

    it('should hide decorative elements from screen readers', () => {
      render(<Breadcrumb items={[{ label: 'Test' }]} />)

      const homeIcon = screen.getByText('🏠')
      expect(homeIcon).toHaveAttribute('aria-hidden', 'true')

      const separator = screen.getByText('›')
      expect(separator).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('Custom className', () => {
    it('should accept and apply custom className', () => {
      render(<Breadcrumb items={[{ label: 'Test' }]} className="custom-class" />)

      const nav = screen.getByTestId('breadcrumb')
      expect(nav.className).toContain('custom-class')
    })
  })
})

describe('Breadcrumb - Real World Scenarios', () => {
  it('should render Dashboard breadcrumb correctly (no items)', () => {
    render(<Breadcrumb items={[]} />)
    expect(screen.queryByTestId('breadcrumb')).not.toBeInTheDocument()
  })

  it('should render Approvals breadcrumb correctly', () => {
    render(<Breadcrumb items={[{ label: 'Approvals' }]} />)

    expect(screen.getByTestId('breadcrumb-home')).toBeInTheDocument()
    expect(screen.getByText('Approvals')).toBeInTheDocument()
    expect(screen.getByText('Approvals')).toHaveAttribute('aria-current', 'page')
  })

  it('should render ServicingView breadcrumb correctly', () => {
    render(
      <Breadcrumb
        items={[
          { label: 'Customer CUST-001' },
          { label: 'John Smith' },
        ]}
      />,
    )

    expect(screen.getByTestId('breadcrumb-home')).toBeInTheDocument()
    expect(screen.getByText('Customer CUST-001')).toBeInTheDocument()
    expect(screen.getByText('John Smith')).toBeInTheDocument()
    
    // Last item should be current page
    const currentPage = screen.getByText('John Smith')
    expect(currentPage).toHaveAttribute('aria-current', 'page')
  })
})
