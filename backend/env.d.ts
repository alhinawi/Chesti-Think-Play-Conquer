declare namespace Cloudflare {
  interface Env {
    DB: D1Database
    ALLOWED_ORIGINS: string
    ADMIN_EMAILS?: string
    TEST_MIGRATIONS: import('cloudflare:test').D1Migration[]
  }
}
