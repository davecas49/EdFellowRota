import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  isServer: typeof window === 'undefined',

  server: {
    SUPABASE_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    ANTHROPIC_API_KEY: z.string().min(1),
    MCP_OAUTH_ISSUER: z.string().url().optional(),
    SERVER_URL: z.string().url().optional(),
  },

  /**
   * The prefix that client-side variables must have. This is enforced both at
   * a type-level and at runtime.
   */
  clientPrefix: 'VITE_',

  client: {
    VITE_SUPABASE_URL: z.string().url(),
    VITE_SUPABASE_ANON_KEY: z.string().min(1),
    VITE_APP_TITLE: z.string().min(1).optional(),
  },

  /**
   * What object holds the environment variables at runtime. This is usually
   * `process.env` or `import.meta.env`.
   */
  runtimeEnv:
    typeof window === 'undefined'
      ? { ...process.env, ...import.meta.env }
      : import.meta.env,

  emptyStringAsUndefined: true,
})
