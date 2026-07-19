import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';

import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../config/supabase-config';

// The app's single shared Supabase client — never scatter client construction
// (.claude/skills/supabase-integration/SKILL.md). Memoized lazily so importing this module
// has no side effects (.claude/skills/code-style/SKILL.md: testable core vs runtime shell).
let memoizedClient: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (memoizedClient === null) {
    memoizedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        // React Native: sessions persist in AsyncStorage (no localStorage),
        // tokens refresh in-process, and there is no browser URL to inspect
        // for OAuth callbacks.
        autoRefreshToken: true,
        detectSessionInUrl: false,
        persistSession: true,
        storage: AsyncStorage,
      },
    });
  }
  return memoizedClient;
};
