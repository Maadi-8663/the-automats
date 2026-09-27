// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// The production origin: Vercel's own address for the project, or SITE_URL.
const site =
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:4321');

export default defineConfig({
  site,
  vite: {
    plugins: [tailwindcss()],
  },
});
