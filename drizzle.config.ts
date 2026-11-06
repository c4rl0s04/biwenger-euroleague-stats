import './scripts/dev/load-env.mjs';
import { databaseUrl } from './src/lib/db/connection-config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: process.env.DATABASE_URL ? { url: databaseUrl(process.env) } : undefined,
});
