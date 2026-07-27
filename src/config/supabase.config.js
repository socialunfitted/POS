/**
 * Supabase Client Configuration
 * Configured with live project URL & anon publishable API key.
 */
export const SUPABASE_CONFIG = {
  url: window.ENV?.SUPABASE_URL || 'https://givqmvmpjssqklhufigr.supabase.co',
  anonKey: window.ENV?.SUPABASE_ANON_KEY || 'sb_publishable_f8uUSMWyMr4l4X67dLWm1A_j2M1ADG6',
  options: {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'omnipos_auth_token'
    },
    global: {
      headers: {
        'x-client-info': 'omnipos-saas-billing'
      }
    }
  }
};
