import { describe, test, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton'

describe('Skeleton component', () => {
  afterEach(() => {
    cleanup()
  })

  test('renders with default props', () => {
    render(<Skeleton />)
    expect(screen.getByTestId('skeleton')).toBeInTheDocument()
  })

  test('applies text variant by default', () => {
    const { container } = render(<Skeleton />)
    const skeleton = container.querySelector('[data-testid="skeleton"]')
    // CSS Modules mangles class names, so check for partial match
    expect(skeleton?.className).toMatch(/text/)
  })

  test('applies rectangular variant', () => {
    const { container } = render(<Skeleton variant="rectangular" />)
    const skeleton = container.querySelector('[data-testid="skeleton"]')
    expect(skeleton?.className).toMatch(/rectangular/)
  })

  test('applies circular variant', () => {
    const { container } = render(<Skeleton variant="circular" />)
    const skeleton = container.querySelector('[data-testid="skeleton"]')
    expect(skeleton?.className).toMatch(/circular/)
  })

  test('applies width as number', () => {
    render(<Skeleton width={100} />)
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveStyle({ width: '100px' })
  })

  test('applies width as string', () => {
    render(<Skeleton width="50%" />)
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveStyle({ width: '50%' })
  })

  test('applies height as number', () => {
    render(<Skeleton height={20} />)
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveStyle({ height: '20px' })
  })

  test('applies custom className', () => {
    const { container } = render(<Skeleton className="custom-class" />)
    const skeleton = container.querySelector('[data-testid="skeleton"]')
    expect(skeleton?.className).toContain('custom-class')
  })

  test('is hidden from accessibility tree', () => {
    render(<Skeleton />)
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('SkeletonText component', () => {
  afterEach(() => {
    cleanup()
  })

  test('renders single line by default', () => {
    render(<SkeletonText />)
    const skeletons = screen.getAllByTestId('skeleton')
    expect(skeletons).toHaveLength(1)
  })

  test('renders multiple lines', () => {
    render(<SkeletonText lines={3} />)
    const skeletons = screen.getAllByTestId('skeleton')
    expect(skeletons).toHaveLength(3)
  })

  test('last line is shorter when multiple lines', () => {
    render(<SkeletonText lines={3} />)
    const skeletons = screen.getAllByTestId('skeleton')
    // Last line should have 70% width
    expect(skeletons[2]).toHaveStyle({ width: '70%' })
  })

  test('single line has full width', () => {
    render(<SkeletonText lines={1} />)
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveStyle({ width: '100%' })
  })
})
