import { timingSafeEqual } from 'node:crypto'

const SERVICE_HEADER = 'authorization'
const WEBHOOK_HEADER = 'x-n8n-webhook-token'

function readBearer(request: Request) {
  const raw = request.headers.get(SERVICE_HEADER)
  if (!raw?.toLowerCase().startsWith('bearer ')) return null
  return raw.slice(7).trim()
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export function n8nServiceToken() {
  return import.meta.env.N8N_SERVICE_TOKEN?.trim() || ''
}

export function n8nWebhookSecret() {
  return import.meta.env.N8N_WEBHOOK_SECRET?.trim() || ''
}

export function isN8nServiceRequest(request: Request) {
  const expected = n8nServiceToken()
  if (!expected) return false
  const token = readBearer(request)
  return Boolean(token && safeEqual(token, expected))
}

export function isN8nWebhookRequest(request: Request) {
  const expected = n8nWebhookSecret()
  if (!expected) return false
  const token = request.headers.get(WEBHOOK_HEADER)
  return Boolean(token && safeEqual(token, expected))
}

export function automationActorHeaders(actor: {
  userId: string
  companyId: string
  tenantId?: string | null
  channel?: string
}) {
  return {
    'x-automation-user-id': actor.userId,
    'x-automation-company-id': actor.companyId,
    ...(actor.tenantId ? { 'x-automation-tenant-id': actor.tenantId } : {}),
    ...(actor.channel ? { 'x-automation-channel': actor.channel } : {})
  }
}

export function readAutomationActorHeaders(request: Request) {
  return {
    userId: request.headers.get('x-automation-user-id')?.trim() ?? '',
    companyId: request.headers.get('x-automation-company-id')?.trim() ?? '',
    tenantId: request.headers.get('x-automation-tenant-id')?.trim() || null,
    channel: request.headers.get('x-automation-channel')?.trim() || null
  }
}
