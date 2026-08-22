import 'server-only';

import { join } from 'node:path';
import { EmergentArtifactRepository } from './emergent-artifacts';
import { FileArtifactObjectStore } from './emergent-file-store';

let repository: EmergentArtifactRepository | null = null;

export function getEmergentArtifactRepository() {
  if (repository) return repository;
  const store = new FileArtifactObjectStore(
    process.env.EMERGENT_ARTIFACT_ROOT || join(process.cwd(), 'data', 'season-review-v5-store')
  );
  repository = new EmergentArtifactRepository(store);
  return repository;
}
