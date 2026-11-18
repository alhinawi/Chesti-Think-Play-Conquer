declare namespace Cloudflare {
  interface Env {
    DB: D1Database
    ALLOWED_ORIGINS: string
    ADMIN_EMAILS?: string
    /** Workers AI binding (free allocation). Optional: the helper answers with a friendly message when missing. */
    AI?: { run(model: string, input: unknown): Promise<unknown> }
    AI_MODEL?: string
    TEST_MIGRATIONS: import('cloudflare:test').D1Migration[]
  }
}
