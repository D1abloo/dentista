/** Cabeceras para mutaciones API (evita bloqueo CSRF de Astro sin Content-Type). */
export const API_JSON_HEADERS = {
  'content-type': 'application/json',
  accept: 'application/json'
} as const;

type ApiEnvelope<T> = {
  data?: T;
  error?: { message?: string; details?: unknown };
  meta?: Record<string, unknown>;
};

/**
 * Lee JSON de una respuesta API; si el cuerpo es HTML/texto (p. ej. CSRF "Cross-site…"),
 * devuelve un mensaje accionable en lugar de lanzar SyntaxError.
 */
export async function readApiJson<T = ApiEnvelope<unknown>>(
  res: Response
): Promise<
  | { parseOk: true; json: T; status: number }
  | { parseOk: false; message: string; status: number }
> {
  const text = await res.text();
  if (!text.trim()) {
    return {
      parseOk: false,
      message: res.ok ? 'Respuesta vacía del servidor.' : `Error del servidor (${res.status}).`,
      status: res.status
    };
  }
  try {
    return { parseOk: true, json: JSON.parse(text) as T, status: res.status };
  } catch {
    if (/cross-site/i.test(text)) {
      return {
        parseOk: false,
        message:
          'El servidor bloqueó la petición por seguridad (CSRF). Recarga la página (F5) e inténtalo de nuevo.',
        status: res.status
      };
    }
    return {
      parseOk: false,
      message:
        res.status === 403
          ? 'Acceso denegado. Cierra sesión, vuelve a entrar e inténtalo otra vez.'
          : `Respuesta inesperada del servidor (${res.status}).`,
      status: res.status
    };
  }
}

export function apiErrorMessage(json: ApiEnvelope<unknown> | undefined, fallback: string) {
  return json?.error?.message ?? fallback;
}
