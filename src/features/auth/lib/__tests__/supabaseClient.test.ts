import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// isSupabaseConfigured reads env at call time, but the module caches
// url/key as module-level consts — so we use vi.resetModules() to get a
// fresh import for each test.

const origUrl = import.meta.env.VITE_SUPABASE_URL;
const origKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

beforeEach(() => vi.resetModules());

afterEach(() => {
  import.meta.env.VITE_SUPABASE_URL = origUrl;
  import.meta.env.VITE_SUPABASE_ANON_KEY = origKey;
});

async function freshModule() {
  return import('../supabaseClient');
}

describe('isSupabaseConfigured', () => {
  it('returns false when both vars are empty', async () => {
    import.meta.env.VITE_SUPABASE_URL = '';
    import.meta.env.VITE_SUPABASE_ANON_KEY = '';
    const { isSupabaseConfigured } = await freshModule();
    expect(isSupabaseConfigured()).toBe(false);
  });

  it('returns false when only URL is set', async () => {
    import.meta.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    import.meta.env.VITE_SUPABASE_ANON_KEY = '';
    const { isSupabaseConfigured } = await freshModule();
    expect(isSupabaseConfigured()).toBe(false);
  });

  it('returns false when only key is set', async () => {
    import.meta.env.VITE_SUPABASE_URL = '';
    import.meta.env.VITE_SUPABASE_ANON_KEY = 'some-key';
    const { isSupabaseConfigured } = await freshModule();
    expect(isSupabaseConfigured()).toBe(false);
  });

  it('returns true when both vars are set', async () => {
    import.meta.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    import.meta.env.VITE_SUPABASE_ANON_KEY = 'some-key';
    const { isSupabaseConfigured } = await freshModule();
    expect(isSupabaseConfigured()).toBe(true);
  });
});

describe('getSupabase', () => {
  it('returns null when not configured', async () => {
    import.meta.env.VITE_SUPABASE_URL = '';
    import.meta.env.VITE_SUPABASE_ANON_KEY = '';
    const { getSupabase } = await freshModule();
    expect(getSupabase()).toBeNull();
  });

  it('returns a client when configured', async () => {
    import.meta.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    import.meta.env.VITE_SUPABASE_ANON_KEY = 'some-key';
    const { getSupabase } = await freshModule();
    expect(getSupabase()).not.toBeNull();
  });

  it('returns the same instance on repeated calls (singleton)', async () => {
    import.meta.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    import.meta.env.VITE_SUPABASE_ANON_KEY = 'some-key';
    const { getSupabase } = await freshModule();
    expect(getSupabase()).toBe(getSupabase());
  });
});
