declare namespace Cloudflare {
  interface Env {
    DB: D1Database
    ALLOWED_ORIGINS: string
    ADMIN_EMAILS?: string
    /** Workers AI binding (free allocation). Optional: the helper answers with a friendly message when missing. */
    AI?: { run(model: string, input: unknown): Promise<unknown> }
    AI_MODEL?: string
    /** Free-plan SQLite Durable Object holding the helper's usage counters. Optional: the helper fails closed without it. */
    HELPER_LIMITER?: DurableObjectNamespace<import('./src/assistant').HelperLimiter>
    /** tests only: isolates the limiter instance */
    HELPER_SCOPE?: string
    TEST_MIGRATIONS: import('cloudflare:test').D1Migration[]
  }
}
