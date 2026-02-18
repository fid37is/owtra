// ==========================================
// FILE: lib/supabase/client.ts
// ==========================================
// Client-side Supabase client for use in Client Components

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './dodo-types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Singleton client instance for client components
export const supabase = createClient()