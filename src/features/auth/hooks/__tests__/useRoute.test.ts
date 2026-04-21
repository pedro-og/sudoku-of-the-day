import { renderHook, act } from '@testing-library/react';
import { useRoute } from '../useRoute';

function setPath(path: string) {
  window.history.pushState({}, '', path);
}

afterEach(() => {
  setPath('/');
});

describe('useRoute', () => {
  it('returns "game" for the root path', () => {
    setPath('/');
    const { result } = renderHook(() => useRoute());
    expect(result.current.route).toBe('game');
  });

  it('returns "account" for /account', () => {
    setPath('/account');
    const { result } = renderHook(() => useRoute());
    expect(result.current.route).toBe('account');
  });

  it('navigate("account") updates the route and URL', () => {
    setPath('/');
    const { result } = renderHook(() => useRoute());
    act(() => result.current.navigate('account'));
    expect(result.current.route).toBe('account');
    expect(window.location.pathname).toBe('/account');
  });

  it('navigate("game") updates the route and URL', () => {
    setPath('/account');
    const { result } = renderHook(() => useRoute());
    act(() => result.current.navigate('game'));
    expect(result.current.route).toBe('game');
    expect(window.location.pathname).toBe('/');
  });

  it('responds to browser back button (popstate)', () => {
    // jsdom does not honour history.back() synchronously, so we simulate
    // what a real browser back would do: change the path then fire popstate.
    setPath('/account');
    const { result } = renderHook(() => useRoute());
    expect(result.current.route).toBe('account');

    act(() => {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(result.current.route).toBe('game');
  });

  it('does not push duplicate history entry for the same path', () => {
    setPath('/account');
    const before = window.history.length;
    const { result } = renderHook(() => useRoute());
    act(() => result.current.navigate('account'));
    expect(window.history.length).toBe(before);
  });
});
