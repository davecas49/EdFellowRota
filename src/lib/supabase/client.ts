import { createBrowserClient } from '@supabase/ssr'

import { env } from '#/env'

import type { Database } from '#/lib/supabase/types'

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)
}
