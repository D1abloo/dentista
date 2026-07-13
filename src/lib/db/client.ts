import {
  localCreateUser,
  localDeleteUser,
  localListUsers,
  localSignInWithPassword,
  localUpdateUserById
} from '@/lib/db/auth'
import { fromTable, PgQueryBuilder } from '@/lib/db/pgQueryBuilder'
import { getPgPool, hasDatabaseConfig } from '@/lib/db/pgPool'

export type { DbError, DbResult } from '@/lib/db/pgQueryBuilder'
export { hasDatabaseConfig, getPgPool }

/** Cliente PostgreSQL — reemplazo de @supabase/supabase-js */
export type DbClient = {
  from: (table: string) => PgQueryBuilder<any>
  auth: {
    signInWithPassword: typeof localSignInWithPassword
    admin: {
      createUser: typeof localCreateUser
      updateUserById: typeof localUpdateUserById
      deleteUser: typeof localDeleteUser
      listUsers: typeof localListUsers
    }
  }
}

let client: DbClient | null = null

export function getDbAdmin(): DbClient {
  if (!hasDatabaseConfig()) {
    throw new Error('Base de datos no configurada. Define DATABASE_URL en .env')
  }
  if (!client) {
    getPgPool()
    client = {
      from: (table: string) => fromTable(table),
      auth: {
        signInWithPassword: localSignInWithPassword,
        admin: {
          createUser: localCreateUser,
          updateUserById: localUpdateUserById,
          deleteUser: localDeleteUser,
          listUsers: localListUsers
        }
      }
    }
  }
  return client
}

/** @deprecated Usar getDbAdmin */
export const getSupabaseAdmin = getDbAdmin

/** @deprecated Usar hasDatabaseConfig */
export const hasSupabaseConfig = hasDatabaseConfig

export const isLocalPostgres = () => true
export const isDemoMode = () => false
