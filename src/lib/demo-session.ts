import type { DemoRole } from '@/types/demo';

const demoCredentials = {
  admin: {
    role: 'admin' as const,
    email: 'admin@clinic.local',
    password: 'admin12345'
  },
  paciente: {
    role: 'patient' as const,
    email: 'maria@example.com',
    password: 'paciente123'
  }
};

export async function establishDemoSession(role: DemoRole) {
  const credentials = role === 'admin' ? demoCredentials.admin : demoCredentials.paciente;
  try {
    await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(credentials)
    });
  } catch {
    // La demo local sigue funcionando con el store del navegador.
  }
}
