import { useEffect, useState, useCallback } from 'react';

/**
 * Minimal client-side routing for two paths: `/` (game) and `/account`.
 * Keeps the URL in sync so Supabase's OAuth redirect target (`/account`)
 * works on reload without pulling in react-router.
 */
export type Route = 'game' | 'account';

function parse(pathname: string): Route {
  return pathname.startsWith('/account') ? 'account' : 'game';
}

export function useRoute(): { route: Route; navigate: (r: Route) => void } {
  const [route, setRoute] = useState<Route>(() => parse(window.location.pathname));

  useEffect(() => {
    const onPop = () => setRoute(parse(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((r: Route) => {
    const path = r === 'account' ? '/account' : '/';
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setRoute(r);
  }, []);

  return { route, navigate };
}
