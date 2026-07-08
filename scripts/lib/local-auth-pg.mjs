import pg from 'pg'
import { loadEnvFile } from './load-env.mjs'

loadEnvFile()

let pool

function getPool() {
  if (!pool) {
    pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: false })
  }
  return pool
}

function mapUser(row) {
  return {
    id: String(row.id),
    email: row.email ? String(row.email) : undefined,
    app_metadata: row.raw_app_meta_data ?? {},
    user_metadata: row.raw_user_meta_data ?? {}
  }
}

export async function createUser(input) {
  const { rows } = await getPool().query(
    `insert into auth.users (
      email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, aud, role
    ) values (
      lower($1), crypt($2, gen_salt('bf')), case when $3 then now() else null end,
      $4::jsonb, $5::jsonb, 'authenticated', 'authenticated'
    )
    returning id, email, raw_app_meta_data, raw_user_meta_data`,
    [
      input.email.trim(),
      input.password,
      input.email_confirm !== false,
      JSON.stringify(input.app_metadata ?? {}),
      JSON.stringify(input.user_metadata ?? {})
    ]
  )
  return { data: { user: mapUser(rows[0]) }, error: null }
}

export async function updateUserById(id, input) {
  const sets = ['updated_at = now()']
  const params = [id]
  let i = 2
  if (input.password) {
    sets.push(`encrypted_password = crypt($${i}, gen_salt('bf'))`)
    params.push(input.password)
    i++
  }
  if (input.app_metadata) {
    sets.push(`raw_app_meta_data = $${i}::jsonb`)
    params.push(JSON.stringify(input.app_metadata))
  }
  await getPool().query(`update auth.users set ${sets.join(', ')} where id = $1`, params)
  const { rows } = await getPool().query(
    `select id, email, raw_app_meta_data, raw_user_meta_data from auth.users where id = $1`,
    [id]
  )
  if (!rows[0]) return { data: { user: null }, error: { message: 'User not found' } }
  return { data: { user: mapUser(rows[0]) }, error: null }
}

export async function deleteUser(id) {
  await getPool().query(`update auth.users set deleted_at = now() where id = $1`, [id])
  return { data: { user: null }, error: null }
}

export async function listUsers({ page = 1, perPage = 200 } = {}) {
  const offset = Math.max(0, (page - 1) * perPage)
  const { rows } = await getPool().query(
    `select id, email, raw_app_meta_data, raw_user_meta_data
     from auth.users where deleted_at is null order by created_at limit $1 offset $2`,
    [perPage, offset]
  )
  return { data: { users: rows.map(mapUser) }, error: null }
}

export const admin = {
  createUser,
  updateUserById,
  deleteUser,
  listUsers
}

export function patchLocalAuth(client) {
  client.auth.admin = admin
}
