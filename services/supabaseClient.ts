
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://famvyucxhbzrxlwfagod.supabase.co';
const supabaseAnonKey = 'sb_publishable_sCakOvTyKaeBDBKu1GsAZg_QvtBtB3O';

let supabaseInstance;

try {
  // We initialize cautiously. If the key format is unexpected, we don't want to kill the script.
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
} catch (e) {
  console.error("Critical: Supabase client failed to initialize.", e);
  // Create a dummy object to prevent 'undefined' property access crashes in components
  supabaseInstance = {
    from: () => ({
      select: () => ({ order: () => Promise.resolve({ data: [], error: null }), limit: () => Promise.resolve({ data: [], error: null }), single: () => Promise.resolve({ data: null, error: null }) }),
      insert: () => Promise.resolve({ data: [], error: null }),
      update: () => Promise.resolve({ data: [], error: null }),
      delete: () => Promise.resolve({ data: [], error: null }),
    }),
    channel: () => ({ on: () => ({ on: () => ({ on: () => ({ on: () => ({ on: () => ({ subscribe: () => ({}) }) }) }) }) }) }),
    removeChannel: () => {}
  } as any;
}

export const supabase = supabaseInstance;
