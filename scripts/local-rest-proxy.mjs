#!/usr/bin/env node
/**
 * Proxy mínimo: supabase-js llama /rest/v1/* → PostgREST en /*
 */
import http from 'node:http'
import { loadEnvFile } from './lib/load-env.mjs'

loadEnvFile()

const listenPort = Number(process.env.DENTISTA_API_PORT || 54321)
const targetBase = (process.env.DENTISTA_REST_INTERNAL_URL || 'http://127.0.0.1:54322').replace(/\/$/, '')

const server = http.createServer(async (req, res) => {
  const incoming = req.url || '/'
  if (!incoming.startsWith('/rest/v1')) {
    res.writeHead(404, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ message: 'Use /rest/v1' }))
    return
  }

  const path = incoming.replace(/^\/rest\/v1/, '') || '/'
  const url = `${targetBase}${path}`

  const headers = { ...req.headers, host: new URL(targetBase).host }
  delete headers['content-length']

  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const body = chunks.length ? Buffer.concat(chunks) : undefined

  try {
    const upstream = await fetch(url, {
      method: req.method,
      headers,
      body: body && req.method !== 'GET' && req.method !== 'HEAD' ? body : undefined
    })

    res.writeHead(upstream.status, Object.fromEntries(upstream.headers.entries()))
    const buf = Buffer.from(await upstream.arrayBuffer())
    res.end(buf)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.writeHead(502, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ message: `PostgREST no disponible: ${msg}` }))
  }
})

server.listen(listenPort, '127.0.0.1', () => {
  console.log(`✓ API local (proxy /rest/v1) → http://127.0.0.1:${listenPort}`)
  console.log(`  PostgREST: ${targetBase}`)
})
