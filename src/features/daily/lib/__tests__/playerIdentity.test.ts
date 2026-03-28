import { getPlayerId } from '../playerIdentity';

describe('getPlayerId', () => {
  it('generates a UUID on first call', () => {
    const id = getPlayerId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('returns the same UUID on subsequent calls', () => {
    const id1 = getPlayerId();
    const id2 = getPlayerId();
    expect(id1).toBe(id2);
  });

  it('persists the UUID to localStorage', () => {
    const id = getPlayerId();
    const stored = localStorage.getItem('daily-sudoku:player-id');
    expect(stored).toBe(id);
  });

  it('returns existing UUID from localStorage', () => {
    const fakeId = '12345678-1234-1234-1234-123456789abc';
    localStorage.setItem('daily-sudoku:player-id', fakeId);
    expect(getPlayerId()).toBe(fakeId);
  });
});
