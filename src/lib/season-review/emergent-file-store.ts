import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import type { ArtifactObjectStore } from './emergent-artifacts';

export class FileArtifactObjectStore implements ArtifactObjectStore {
  constructor(private readonly root: string) {}

  async put(key: string, value: Uint8Array) {
    const file = resolve(this.root, key);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, value);
  }

  async get(key: string) {
    try {
      return new Uint8Array(await readFile(resolve(this.root, key)));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
  }
}
