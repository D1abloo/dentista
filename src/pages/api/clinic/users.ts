import type { APIRoute } from 'astro';
import { fail } from '@/lib/http';

export const prerender = false;

const BLOCKED =
  'La gestión de usuarios solo está disponible en el panel de plataforma (/platform/usuarios).';

export const GET: APIRoute = async () => fail(BLOCKED, 403);

export const POST: APIRoute = async () => fail(BLOCKED, 403);
