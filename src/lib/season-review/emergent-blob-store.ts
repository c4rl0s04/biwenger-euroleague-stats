import 'server-only';

import { get, put } from '@vercel/blob';
import type { ArtifactObjectStore } from './emergent-artifacts';

export class VercelBlobArtifactStore implements ArtifactObjectStore {
  async put(key: string, value: Uint8Array, contentType = 'application/octet-stream') {
    await put(key, Buffer.from(value), {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType,
      cacheControlMaxAge: key.endsWith('/latest.json') ? 60 : 31_536_000,
    });
  }

  async get(key: string) {
    const result = await get(key, {
      access: 'private',
      useCache: !key.endsWith('/latest.json'),
    });
    if (!result || result.statusCode === 304 || !result.stream) return null;
    return new Uint8Array(await new Response(result.stream).arrayBuffer());
  }
}
