import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { InteractiveSandbox } from '../components/InteractiveSandbox';
import React from 'react';

describe('InteractiveSandbox component', () => {
  it('renders sliders and assessment status correctly', () => {
    const mockSetExpenses = vi.fn();
    const mockSetSavings = vi.fn();
    const mockSetTimeline = vi.fn();

    render(
      <InteractiveSandbox
        sandboxExpenses={50000}
        sandboxSavings={500000}
        sandboxTimeline={6}
        setSandboxExpenses={mockSetExpenses}
        setSandboxSavings={mockSetSavings}
        setSandboxTimeline={mockSetTimeline}
        liveRunway={10.0}
        liveBuffer={300000}
        liveShortfall={0}
        liveStatus="safe"
      />
    );

    expect(screen.getByText('Adjust Parameters')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument(); // liveRunway count
    expect(screen.getByText('₹3,00,000')).toBeInTheDocument(); // liveBuffer
    expect(screen.getByText('₹0 (Secure Runway)')).toBeInTheDocument();
    expect(screen.getByText(/safe\s+safety\s+net/i)).toBeInTheDocument();
  });
});
