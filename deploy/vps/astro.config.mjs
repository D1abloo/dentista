/**
 * Configuración Astro para VPS Linux (Node standalone).
 * No sustituye astro.config.mjs de Vercel; úsala solo en self-hosting:
 *   npm run build:vps && npm run start:vps
 */
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [react(), tailwind({ applyBaseStyles: false })],
  server: {
    host: '127.0.0.1',
    port: 4321
  }
});
