import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  _supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  return _supabase;
}

// Proxy that lazily initializes the Supabase client, avoiding
// "supabaseUrl is required" errors during static page generation
// when env vars are not available at build time.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    // Bind functions to preserve `this` context
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
