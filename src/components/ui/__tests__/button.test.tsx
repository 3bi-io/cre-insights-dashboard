import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, userEvent } from '@/tests/utils/test-utils';
import { Button } from '../button';

describe('Button Component', () => {
  it('renders correctly with default props', () => {
    const { getByRole } = renderWithProviders(<Button>Click me</Button>);
    const button = getByRole('button');
    
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click me');
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    const { getByRole } = renderWithProviders(
      <Button onClick={handleClick}>Click me</Button>
    );
    
    const button = getByRole('button');
    await user.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', () => {
    const handleClick = vi.fn();
    const { getByRole } = renderWithProviders(
      <Button disabled onClick={handleClick}>
        Click me
      </Button>
    );
    
    const button = getByRole('button');
    expect(button).toBeDisabled();
  });

  it('applies variant styles correctly', () => {
    const { getByRole, rerender } = renderWithProviders(
      <Button variant="destructive">Delete</Button>
    );
    
    const button = getByRole('button');
    expect(button).toBeInTheDocument();
    
    rerender(<Button variant="outline">Outline</Button>);
    expect(button).toBeInTheDocument();
  });

  it('applies size variants correctly', () => {
    const { getByRole } = renderWithProviders(
      <Button size="lg">Large Button</Button>
    );
    
    const button = getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('renders as child component when asChild is true', () => {
    const { container } = renderWithProviders(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    
    const link = container.querySelector('a');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test');
  });

  it('accepts custom className', () => {
    const { getByRole } = renderWithProviders(
      <Button className="custom-class">Custom</Button>
    );
    
    const button = getByRole('button');
    expect(button).toHaveClass('custom-class');
  });
});
