import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('UI Component <Button />', () => {
  it('renders button with child text correctly', () => {
    render(<Button>Submit Order</Button>);
    const button = screen.getByRole('button', { name: /submit order/i });
    expect(button).toBeInTheDocument();
  });

  it('triggers onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    const handleClick = jest.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    const button = screen.getByRole('button', { name: /disabled/i });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('shows loading state and is disabled when isLoading is true', () => {
    render(<Button isLoading>Processing</Button>);
    const button = screen.getByRole('button', { name: /processing/i });
    expect(button).toBeDisabled();
    // Verify spinner svg is rendered inside button
    const spinnerSvg = button.querySelector('svg');
    expect(spinnerSvg).toBeInTheDocument();
  });
});
