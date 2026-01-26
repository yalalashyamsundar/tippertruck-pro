
import { createClient } from '@supabase/supabase-js';

// Using credentials provided by the user for project 'Tipperlog'
const supabaseUrl = 'https://famvyucxhbzrxlwfagod.supabase.co';
const supabaseAnonKey = 'sb_publishable_sCakOvTyKaeBDBKu1GsAZg_QvtBtB3O';

// Initializing the client with the provided public key.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

if (!supabase) {
  console.warn("Supabase client failed to initialize with provided credentials.");
}
