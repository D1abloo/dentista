import type { APIContext } from 'astro'
import { fail } from '@/lib/http'
import { isN8nServiceRequest } from './serviceAuth'

export function requireN8nService(context: APIContext) {
  if (!isN8nServiceRequest(context.request)) {
    return fail('Token de servicio n8n inválido o ausente.', 403)
  }
  return null
}
