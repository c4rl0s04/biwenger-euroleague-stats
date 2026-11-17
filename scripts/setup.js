#!/usr/bin/env node

import readline from 'node:readline/promises';
import { Writable } from 'node:stream';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { databaseUrl } from '../src/lib/db/connection-config.ts';

const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '.env');
let hidden = false;
const output = new Writable({
  write(chunk, encoding, done) {
    if (!hidden) process.stdout.write(chunk, encoding);
    done();
  },
});
const rl = readline.createInterface({
  input: process.stdin,
  output,
  terminal: Boolean(process.stdin.isTTY),
});

async function ask(prompt, secret = false) {
  process.stdout.write(prompt);
  hidden = secret;
  try {
    return (await rl.question('')).trim();
  } finally {
    hidden = false;
    if (secret) process.stdout.write('\n');
  }
}

async function main() {
  if (fs.existsSync(envPath))
    throw new Error(
      '.env already exists. Edit it in place; setup will not replace credentials or encryption keys.'
    );
  console.log('Biwenger Stats setup. Values stay on this machine; no provider requests are made.');
  const settings = {};
  settings.DATABASE_URL = databaseUrl({ DATABASE_URL: await ask('DATABASE_URL: ', true) });
  settings.AUTH_SECRET = crypto.randomBytes(32).toString('base64');
  if ((await ask('Enable personal Biwenger account linking? [y/N]: ')).toLowerCase() === 'y') {
    settings.BIWENGER_CREDENTIAL_KEYS = JSON.stringify([
      { id: 'primary', key: crypto.randomBytes(32).toString('base64') },
    ]);
    settings.BIWENGER_CREDENTIAL_ACTIVE_KEY_ID = 'primary';
  }
  const token = await ask('Background BIWENGER_TOKEN (optional): ', true);
  if (token) settings.BIWENGER_TOKEN = token;
  const provider = await ask('AI provider (groq/openai, or blank to disable): ');
  if (provider) {
    if (!['groq', 'openai'].includes(provider)) throw new Error('Choose groq or openai.');
    settings.AI_PROVIDER = provider;
    const key = await ask('AI provider key: ', true);
    if (!key) throw new Error('The selected AI provider requires its key.');
    settings[provider === 'groq' ? 'GROQ_API_KEY' : 'OPENAI_API_KEY'] = key;
    const model = await ask('AI_MODEL (optional; blank uses provider default): ');
    if (model) settings.AI_MODEL = model;
  }
  // Single quotes preserve JSON keyrings and URLs without interpolation or escape conversion.
  const content =
    Object.entries(settings)
      .map(([name, value]) => {
        if (/[\r\n']/.test(value))
          throw new Error(
            `Unsupported quote or newline in ${name}; encode URL characters where needed.`
          );
        return `${name}='${value}'`;
      })
      .join('\n') + '\n';
  fs.writeFileSync(envPath, content, { flag: 'wx', mode: 0o600 });
  console.log('Created .env. Keep a secure backup of encryption keys.');
  console.log(
    'Next: apply committed migrations to your intended database, then create a season using db:season:create-next with explicit arguments.'
  );
  console.log(
    'See docs/operations/season-lifecycle.md. Account login uses stored password hashes; linking uses personal credentials.'
  );
}

main()
  .catch(() => {
    console.error(
      'Setup failed. Check inputs and whether .env exists; no credentials were printed.'
    );
    process.exitCode = 1;
  })
  .finally(() => rl.close());
