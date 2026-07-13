const TABLE_RE = /^[a-z_][a-z0-9_]*$/i
const COL_RE = /^[a-z_*][a-z0-9_*,.() ]*$/i

const EMBED_FK = {
  profiles: { clinics: 'clinic_id', organization_groups: 'organization_id' },
  clinic_subscriptions: { clinics: 'clinic_id' },
  clinic_usage_daily: { clinics: 'clinic_id' },
  staff_clinic_assignments: { clinics: 'clinic_id', organization_groups: 'organization_id' }
}

function assertTable(table) {
  if (!TABLE_RE.test(table)) throw new Error(`Tabla no válida: ${table}`)
}

function assertColumn(column) {
  if (!COL_RE.test(column)) throw new Error(`Columna no válida: ${column}`)
}

function parseEmbeds(select, baseTable) {
  const embeds = []
  let base = select
  const re = /,?\s*([a-z_][a-z0-9_]*)\(([^)]+)\)/gi
  let match
  while ((match = re.exec(select))) {
    const alias = match[1]
    const table = alias
    const columns = match[2].split(',').map((c) => c.trim())
    const fk = EMBED_FK[baseTable]?.[alias] ?? `${alias.replace(/s$/, '')}_id`
    embeds.push({ alias, table, columns, fk })
    base = base.replace(match[0], '').replace(/,\s*,/g, ',').replace(/^,\s*/, '').replace(/,\s*$/, '')
  }
  if (!base.trim()) base = '*'
  return { baseSelect: base.trim(), embeds }
}

function parseOrExpr(expr, params, startIdx) {
  const parts = expr.split(',')
  const clauses = []
  let i = startIdx
  for (const part of parts) {
    const m = part.trim().match(/^([a-z_][a-z0-9_]*)\.(eq|neq|ilike)\.(.+)$/i)
    if (!m) continue
    const col = m[1]
    const op = m[2]
    const rawVal = m[3]
    assertColumn(col)
    if (op === 'eq') {
      clauses.push(`${col} = $${i}`)
      params.push(rawVal)
      i++
    } else if (op === 'neq') {
      clauses.push(`${col} <> $${i}`)
      params.push(rawVal)
      i++
    } else if (op === 'ilike') {
      clauses.push(`${col} ILIKE $${i}`)
      params.push(rawVal)
      i++
    }
  }
  return { sql: clauses.length ? `(${clauses.join(' OR ')})` : 'true', next: i }
}

function buildWhere(filters, params, start = 1) {
  if (!filters.length) return { sql: '', next: start }
  const clauses = []
  let i = start
  for (const f of filters) {
    if (f.kind === 'or') {
      const parsed = parseOrExpr(f.expr, params, i)
      clauses.push(parsed.sql)
      i = parsed.next
      continue
    }
    assertColumn(f.column)
    if (f.kind === 'eq') {
      clauses.push(`t.${f.column} = $${i}`)
      params.push(f.value)
      i++
    } else if (f.kind === 'neq') {
      clauses.push(`t.${f.column} <> $${i}`)
      params.push(f.value)
      i++
    } else if (f.kind === 'in') {
      clauses.push(`t.${f.column} = ANY($${i})`)
      params.push(f.value)
      i++
    } else if (f.kind === 'ilike') {
      clauses.push(`t.${f.column} ILIKE $${i}`)
      params.push(f.value)
      i++
    } else if (f.kind === 'gte') {
      clauses.push(`t.${f.column} >= $${i}`)
      params.push(f.value)
      i++
    } else if (f.kind === 'lte') {
      clauses.push(`t.${f.column} <= $${i}`)
      params.push(f.value)
      i++
    } else if (f.kind === 'gt') {
      clauses.push(`t.${f.column} > $${i}`)
      params.push(f.value)
      i++
    } else if (f.kind === 'lt') {
      clauses.push(`t.${f.column} < $${i}`)
      params.push(f.value)
      i++
    } else if (f.kind === 'is') {
      clauses.push(`t.${f.column} IS NULL`)
    } else if (f.kind === 'not') {
      clauses.push(`t.${f.column} IS NOT NULL`)
    }
  }
  return { sql: ` WHERE ${clauses.join(' AND ')}`, next: i }
}

function rowToObject(row, embeds) {
  const out = { ...row }
  for (const embed of embeds) {
    const raw = row[embed.alias]
    if (raw && typeof raw === 'object') out[embed.alias] = raw
    else if (raw === null) out[embed.alias] = null
    else delete out[embed.alias]
  }
  return out
}

export class PgQueryBuilder {
  constructor(table, pool) {
    assertTable(table)
    this.pool = pool
    this.state = { table, op: 'select', filters: [], orders: [], single: 'none' }
  }

  select(columns = '*', opts) {
    if (['insert', 'update', 'upsert', 'delete'].includes(this.state.op)) {
      this.state.select = columns
      return this
    }
    this.state.op = 'select'
    this.state.select = columns
    this.state.countExact = opts?.count === 'exact'
    this.state.headOnly = opts?.head === true
    return this
  }

  insert(payload) {
    this.state.op = 'insert'
    this.state.payload = payload
    this.state.returning = true
    return this
  }

  update(payload) {
    this.state.op = 'update'
    this.state.payload = payload
    this.state.returning = true
    return this
  }

  delete() {
    this.state.op = 'delete'
    this.state.returning = true
    return this
  }

  upsert(payload, opts) {
    this.state.op = 'upsert'
    this.state.payload = payload
    this.state.onConflict = opts?.onConflict
    this.state.returning = true
    return this
  }

  eq(column, value) {
    this.state.filters.push({ kind: 'eq', column, value })
    return this
  }

  neq(column, value) {
    this.state.filters.push({ kind: 'neq', column, value })
    return this
  }

  in(column, value) {
    this.state.filters.push({ kind: 'in', column, value })
    return this
  }

  ilike(column, value) {
    this.state.filters.push({ kind: 'ilike', column, value })
    return this
  }

  gte(column, value) {
    this.state.filters.push({ kind: 'gte', column, value })
    return this
  }

  lte(column, value) {
    this.state.filters.push({ kind: 'lte', column, value })
    return this
  }

  gt(column, value) {
    this.state.filters.push({ kind: 'gt', column, value })
    return this
  }

  lt(column, value) {
    this.state.filters.push({ kind: 'lt', column, value })
    return this
  }

  is(column, value) {
    this.state.filters.push({ kind: 'is', column, value })
    return this
  }

  not(column, op, value) {
    if (op === 'is' && value === null) this.state.filters.push({ kind: 'not', column, op, value })
    return this
  }

  or(expr) {
    this.state.filters.push({ kind: 'or', expr })
    return this
  }

  order(column, opts) {
    this.state.orders.push({ column, ascending: opts?.ascending !== false })
    return this
  }

  limit(n) {
    this.state.limitN = n
    return this
  }

  single() {
    this.state.single = 'one'
    this.state.limitN = 1
    return this
  }

  maybeSingle() {
    this.state.single = 'maybe'
    this.state.limitN = 1
    return this
  }

  then(onfulfilled, onrejected) {
    return this.execute().then(onfulfilled, onrejected)
  }

  async execute() {
    try {
      return await this.runQuery()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error de base de datos'
      return { data: null, error: { message } }
    }
  }

  async runQuery() {
    const s = this.state
    const params = []

    if (s.op === 'select') {
      const selectStr = s.select ?? '*'
      const { baseSelect, embeds } = parseEmbeds(selectStr, s.table)
      const joins = embeds
        .map((e) => `LEFT JOIN ${e.table} ${e.alias} ON ${e.alias}.id = t.${e.fk}`)
        .join(' ')
      const embedCols = embeds
        .map(
          (e) =>
            `CASE WHEN ${e.alias}.id IS NOT NULL THEN json_build_object(${e.columns.map((c) => `'${c}', ${e.alias}.${c}`).join(', ')}) END AS ${e.alias}`
        )
        .join(', ')
      const cols =
        baseSelect === '*'
          ? embedCols
            ? `t.*, ${embedCols}`
            : 't.*'
          : `${baseSelect.split(',').map((c) => `t.${c.trim()}`).join(', ')}${embedCols ? `, ${embedCols}` : ''}`

      const where = buildWhere(s.filters, params)
      if (s.countExact && s.headOnly) {
        const countSql = `SELECT COUNT(*)::int AS count FROM ${s.table} t ${joins}${where.sql}`
        const res = await this.pool.query(countSql, params)
        return { data: null, error: null, count: Number(res.rows[0]?.count ?? 0) }
      }
      let sql = `SELECT ${cols} FROM ${s.table} t ${joins}${where.sql}`
      if (s.orders.length) {
        sql += ` ORDER BY ${s.orders.map((o) => `t.${o.column} ${o.ascending ? 'ASC' : 'DESC'}`).join(', ')}`
      }
      if (s.limitN != null) sql += ` LIMIT ${s.limitN}`
      const res = await this.pool.query(sql, params)
      const rows = res.rows.map((r) => rowToObject(r, embeds))
      return this.finalizeRows(rows, res.rowCount)
    }

    if (s.op === 'insert' || s.op === 'upsert') {
      const rows = Array.isArray(s.payload) ? s.payload : [s.payload]
      const keys = Object.keys(rows[0] ?? {})
      const valuesSql = rows
        .map((row, ri) => {
          const ph = keys.map((k, ci) => `$${ri * keys.length + ci + 1}`)
          keys.forEach((k) => params.push(row[k]))
          return `(${ph.join(', ')})`
        })
        .join(', ')
      let sql = `INSERT INTO ${s.table} (${keys.join(', ')}) VALUES ${valuesSql}`
      if (s.op === 'upsert' && s.onConflict) {
        const updates = keys.filter((k) => k !== s.onConflict).map((k) => `${k} = EXCLUDED.${k}`)
        sql += ` ON CONFLICT (${s.onConflict}) DO UPDATE SET ${updates.join(', ')}`
      }
      sql += ' RETURNING *'
      const res = await this.pool.query(sql, params)
      return this.finalizeRows(res.rows, res.rowCount)
    }

    if (s.op === 'update') {
      const payload = s.payload ?? {}
      const keys = Object.keys(payload)
      let i = 1
      const sets = keys.map((k) => {
        params.push(payload[k])
        return `${k} = $${i++}`
      })
      const where = buildWhere(s.filters, params, i)
      const sql = `UPDATE ${s.table} t SET ${sets.join(', ')}${where.sql} RETURNING *`
      const res = await this.pool.query(sql, params)
      return this.finalizeRows(res.rows, res.rowCount)
    }

    if (s.op === 'delete') {
      const where = buildWhere(s.filters, params)
      const sql = `DELETE FROM ${s.table} t${where.sql} RETURNING *`
      const res = await this.pool.query(sql, params)
      return this.finalizeRows(res.rows, res.rowCount)
    }

    return { data: null, error: { message: 'Operación no soportada' } }
  }

  finalizeRows(rows, rowCount) {
    const s = this.state
    if (s.single === 'one') {
      if (!rows.length) return { data: null, error: { message: 'No rows', code: 'PGRST116' } }
      if (rows.length > 1) return { data: null, error: { message: 'Multiple rows', code: 'PGRST116' } }
      return { data: rows[0], error: null, count: rowCount }
    }
    if (s.single === 'maybe') {
      return { data: rows[0] ?? null, error: null, count: rowCount }
    }
    return { data: rows, error: null, count: rowCount }
  }
}

export function fromTable(table, pool) {
  return new PgQueryBuilder(table, pool)
}
