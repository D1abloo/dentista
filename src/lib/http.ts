export function ok<T>(data: T, meta: Record<string, unknown> = {}) {
  return new Response(JSON.stringify({ data, error: null, meta }), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
}

export function created<T>(data: T, meta: Record<string, unknown> = {}) {
  return new Response(JSON.stringify({ data, error: null, meta }), {
    status: 201,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
}

export function fail(message: string, status = 400, details?: unknown) {
  return new Response(JSON.stringify({ data: null, error: { message, details }, meta: {} }), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
}
