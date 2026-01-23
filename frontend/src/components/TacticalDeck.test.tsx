import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TacticalDeck } from './TacticalDeck';

describe('TacticalDeck', () => {
  it('renders component with title', () => {
    render(<TacticalDeck kIndex={3} />);

    expect(screen.getByText('Tactical Protocol Deck')).toBeInTheDocument();
    expect(screen.getByText("Today's recommended interventions")).toBeInTheDocument();
  });

  it('displays current K-Index value', () => {
    render(<TacticalDeck kIndex={5.5} />);

    expect(screen.getByText('Kp 5.5')).toBeInTheDocument();
  });

  it('shows QUIET CONDITIONS for low K-Index', () => {
    render(<TacticalDeck kIndex={2} />);

    expect(screen.getByText('QUIET CONDITIONS')).toBeInTheDocument();
  });

  it('shows UNSETTLED CONDITIONS for moderate K-Index', () => {
    render(<TacticalDeck kIndex={4} />);

    expect(screen.getByText('UNSETTLED CONDITIONS')).toBeInTheDocument();
  });

  it('shows STORM CONDITIONS for high K-Index', () => {
    render(<TacticalDeck kIndex={6} />);

    expect(screen.getByText('STORM CONDITIONS')).toBeInTheDocument();
  });

  it('shows SEVERE CONDITIONS for extreme K-Index', () => {
    render(<TacticalDeck kIndex={8} />);

    expect(screen.getByText('SEVERE CONDITIONS')).toBeInTheDocument();
  });

  it('renders three protocol cards', () => {
    render(<TacticalDeck kIndex={5} />);

    // Check that we have the grid container with cards
    const cards = screen.getAllByText(/Common|Rare|Legendary/);
    expect(cards.length).toBe(3);
  });

  it('displays appropriate cards for quiet conditions', () => {
    render(<TacticalDeck kIndex={1} />);

    // Quiet conditions should show: renewalBurst, sparkOfClarity, controlledBurn
    expect(screen.getByText('Renewal Burst')).toBeInTheDocument();
    expect(screen.getByText('Spark of Clarity')).toBeInTheDocument();
    expect(screen.getByText('Controlled Burn')).toBeInTheDocument();
  });

  it('displays appropriate cards for storm conditions', () => {
    render(<TacticalDeck kIndex={6} />);

    // Storm conditions should show: groundingAnchor, calmingTide, conductiveShield
    expect(screen.getByText('Grounding Anchor')).toBeInTheDocument();
    expect(screen.getByText('Calming Tide')).toBeInTheDocument();
    expect(screen.getByText('Conductive Shield')).toBeInTheDocument();
  });

  it('displays appropriate cards for severe conditions', () => {
    render(<TacticalDeck kIndex={8} />);

    // Severe conditions should show: mountainResilience, groundingAnchor, deepCurrents
    expect(screen.getByText('Mountain Resilience')).toBeInTheDocument();
    expect(screen.getByText('Grounding Anchor')).toBeInTheDocument();
    expect(screen.getByText('Deep Currents')).toBeInTheDocument();
  });

  it('shows footer text', () => {
    render(<TacticalDeck kIndex={3} />);

    expect(screen.getByText('Cards selected based on current space weather and system dynamics')).toBeInTheDocument();
  });
});
