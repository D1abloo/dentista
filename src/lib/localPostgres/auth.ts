import pg from 'pg'

let pool: pg.Pool | null = null

export function isLocalPostgresMode() {
  return import.meta.env.LOCAL_POSTGRES === 'true'
}

export function getPgPool() {
  const url = import.meta.env.DATABASE_URL
  if (!url) throw new Error('Falta DATABASE_URL para PostgreSQL local.')
  if (!pool) {
    pool = new pg.Pool({
      connectionString: url,
      max: 8,
      ssl: false
    })
  }
  return pool
}

export type LocalAuthUser = {
  id: string
  email?: string
  app_metadata?: Record<string, unknown>
  user_metadata?: Record<string, unknown>
}

function mapUser(row: Record<string, unknown>): LocalAuthUser {
  return {
    id: String(row.id),
    email: row.email ? String(row.email) : undefined,
    app_metadata: (row.raw_app_meta_data as Record<string, unknown>) ?? {},
    user_metadata: (row.raw_user_meta_data as Record<string, unknown>) ?? {}
  }
}

export async function localSignInWithPassword(email: string, password: string) {
  const pool = getPgPool()
  const { rows } = await pool.query(
    `select id, email, encrypted_password, raw_app_meta_data, raw_user_meta_data
     from auth.users
     where lower(email) = lower($1) and deleted_at is null
     limit 1`,
    [email.trim()]
  )
  const row = rows[0]
  if (!row?.encrypted_password) {
    return { data: { user: null, session: null }, error: { message: 'Invalid login credentials' } }
  }
  const { rows: okRows } = await pool.query(
    `select (encrypted_password = crypt($1, encrypted_password)) as ok`,
    [password]
  )
  if (!okRows[0]?.ok) {
    return { data: { user: null, session: null }, error: { message: 'Invalid login credentials' } }
  }
  await pool.query(`update auth.users set last_sign_in_at = now(), updated_at = now() where id = $1`, [
    row.id
  ])
  const user = mapUser(row)
  return {
    data: { user, session: { access_token: 'local', user } },
    error: null
  }
}

export async function localCreateUser(input: {
  email: string
  password: string
  email_confirm?: boolean
  app_metadata?: Record<string, unknown>
  user_metadata?: Record<string, unknown>
}) {
  const pool = getPgPool()
  const { rows } = await pool.query(
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

export async function localUpdateUserById(
  id: string,
  input: { password?: string; app_metadata?: Record<string, unknown> }
) {
  const pool = getPgPool()
  const sets: string[] = ['updated_at = now()']
  const params: unknown[] = [id]
  let i = 2
  if (input.password) {
    sets.push(`encrypted_password = crypt($${i}, gen_salt('bf'))`)
    params.push(input.password)
    i++
  }
  if (input.app_metadata) {
    sets.push(`raw_app_meta_data = $${i}::jsonb`)
    params.push(JSON.stringify(input.app_metadata))
    i++
  }
  await pool.query(`update auth.users set ${sets.join(', ')} where id = $1`, params)
  const { rows } = await pool.query(
    `select id, email, raw_app_meta_data, raw_user_meta_data from auth.users where id = $1`,
    [id]
  )
  if (!rows[0]) return { data: { user: null }, error: { message: 'User not found' } }
  return { data: { user: mapUser(rows[0]) }, error: null }
}

export async function localDeleteUser(id: string) {
  const pool = getPgPool()
  await pool.query(`update auth.users set deleted_at = now() where id = $1`, [id])
  return { data: { user: null }, error: null }
}

export async function localListUsers(page = 1, perPage = 200) {
  const pool = getPgPool()
  const offset = Math.max(0, (page - 1) * perPage)
  const { rows } = await pool.query(
    `select id, email, raw_app_meta_data, raw_user_meta_data
     from auth.users
     where deleted_at is null
     order by created_at
     limit $1 offset $2`,
    [perPage, offset]
  )
  return { data: { users: rows.map(mapUser) }, error: null }
}

export function patchLocalAuthAdmin(client: { auth: { admin: unknown } }) {
  client.auth.admin = {
    createUser: (input: Parameters<typeof localCreateUser>[0]) => localCreateUser(input),
    updateUserById: (id: string, input: Parameters<typeof localUpdateUserById>[1]) =>
      localUpdateUserById(id, input),
    deleteUser: (id: string) => localDeleteUser(id),
    listUsers: ({ page, perPage }: { page?: number; perPage?: number }) =>
      localListUsers(page ?? 1, perPage ?? 200)
  }
}
