import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { getCookies, setCookie } from '@tanstack/react-start/server'

import { env } from '#/env'

import type { Database } from '#/lib/supabase/types'

/**
 * Request-scoped client that reads the signed-in user's session from cookies
 * and enforces RLS as that user. Use this in server functions that act on
 * behalf of the caller.
 */
export function createSupabaseServerClient() {
  return createServerClient<Database>(env.SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        const cookies = getCookies()
        return Object.entries(cookies).map(([name, value]) => ({ name, value }))
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          setCookie(name, value, options)
        }
      },
    },
  })
}

/**
 * Service-role client that bypasses RLS entirely. Reserved for trusted
 * server-only paths: staff reads of reflections/peer feedback, the guest
 * feedback token endpoint, the Excel import, and MCP tools.
 */
export function createSupabaseAdminClient() {
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
