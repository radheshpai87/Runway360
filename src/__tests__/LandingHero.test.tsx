import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LandingHero } from '../components/LandingHero';
import React from 'react';

// Mock Lucide icons because they can be complex in testing environments
vi.mock('lucide-react', () => ({
  ArrowUpRight: () => <span>ArrowUpRight</span>,
  Activity: () => <span>Activity</span>,
  Layers: () => <span>Layers</span>,
}));

describe('LandingHero component', () => {
  it('renders correctly for unauthenticated user', () => {
    const mockStart = vi.fn();
    const mockSignIn = vi.fn();

    render(
      <LandingHero
        status="unauthenticated"
        startInterview={mockStart}
        signIn={mockSignIn}
      />
    );

    expect(screen.getByText('Plan your career leap.')).toBeInTheDocument();
    expect(screen.getByText('Sign In to Start Audit')).toBeInTheDocument();

    const button = screen.getByText('Sign In to Start Audit');
    fireEvent.click(button);
    expect(mockSignIn).toHaveBeenCalledWith('google');
  });

  it('renders correctly for authenticated user', () => {
    const mockStart = vi.fn();
    const mockSignIn = vi.fn();

    render(
      <LandingHero
        status="authenticated"
        startInterview={mockStart}
        signIn={mockSignIn}
      />
    );

    expect(screen.getByText('Start Interactive Audit')).toBeInTheDocument();

    const button = screen.getByText('Start Interactive Audit');
    fireEvent.click(button);
    expect(mockStart).toHaveBeenCalled();
  });
});
