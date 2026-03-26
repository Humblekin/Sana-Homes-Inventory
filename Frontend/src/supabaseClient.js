import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create a dummy client if keys are missing to avoid crash
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : { 
      auth: { 
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }), 
        getSession: async () => ({ data: { session: null } }),
        signInWithPassword: async () => ({ data: { user: null }, error: { message: 'Supabase credentials missing. Check .env file.' } }),
        signOut: async () => {} 
      }, 
      from: () => ({ 
        select: () => ({ 
          order: () => Promise.resolve({ data: [], error: null }),
          update: () => ({ eq: () => ({ select: () => Promise.resolve({ data: [], error: null }) }) }),
          insert: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
          delete: () => ({ eq: () => Promise.resolve({ error: null }) })
        }) 
      }) 
    };
