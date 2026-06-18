import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { WeekStrip } from '../WeekStrip';
import type { WeekDayStatus } from '@/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe('WeekStrip', () => {
  it('renders all seven day labels', () => {
    const statuses: WeekDayStatus[] = ['done', 'done', 'done', 'future', 'future', 'future', 'future'];
    render(<WeekStrip statuses={statuses} streak={3} />);
    ['week.mon', 'week.tue', 'week.wed', 'week.thu', 'week.fri', 'week.sat', 'week.sun'].forEach((k) => {
      expect(screen.getByText(k)).toBeInTheDocument();
    });
  });

  it('shows fire for done, ice for frozen and X for missed', () => {
    const statuses: WeekDayStatus[] = ['done', 'frozen', 'missed', 'future', 'future', 'future', 'future'];
    render(<WeekStrip statuses={statuses} streak={5} />);
    expect(screen.getByText('🔥')).toBeInTheDocument();
    expect(screen.getByText('🧊')).toBeInTheDocument();
    expect(screen.getByText('❌')).toBeInTheDocument();
  });

  it('renders the running streak total', () => {
    render(<WeekStrip statuses={['done', 'future', 'future', 'future', 'future', 'future', 'future']} streak={7} />);
    expect(screen.getByText(/week.streakTotal/)).toBeInTheDocument();
  });
});
