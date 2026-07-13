import pg from 'pg'
import { loadEnvFile } from './load-env.mjs'
import { admin } from './local-auth-pg.mjs'
import { fromTable } from './pg-query-builder.mjs'

loadEnvFile()

let pool

function getPool() {
  if (!pool) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('Falta DATABASE_URL en .env')
    const useSsl = process.env.DATABASE_SSL === 'true' || /sslmode=require/i.test(url)
    pool = new pg.Pool({
      connectionString: url,
      max: 8,
      ssl: useSsl ? { rejectUnauthorized: false } : false
    })
  }
  return pool
}

/** Cliente PostgreSQL para scripts (misma API que la app). */
export function createDbClient() {
  getPool()
  return {
    from: (table) => fromTable(table, getPool()),
    auth: {
      signInWithPassword: async () => {
        throw new Error('signInWithPassword no disponible en scripts; usa admin')
      },
      admin
    }
  }
}
