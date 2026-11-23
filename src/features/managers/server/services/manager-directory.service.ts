import 'server-only';
import { readManagerDirectoryRows } from '../queries/manager-directory.query';
import { mapManagerDirectoryRow } from '../mappers/manager-directory.mapper';
import type { ManagerDirectoryViewModel } from '../../models/manager-directory';

export const MANAGER_DIRECTORY_POLICY = Object.freeze({
  access: 'public fantasy directory; no session identity',
  httpCache: 'private, no-store, max-age=0, must-revalidate',
  serverCache: 'none; resolve active read season on every call',
  mutations: 'none',
} as const);

export function createManagerDirectoryService(read = readManagerDirectoryRows) {
  return async function getManagerDirectory(): Promise<ManagerDirectoryViewModel[]> {
    return (await read()).map(mapManagerDirectoryRow);
  };
}

export const getManagerDirectory = createManagerDirectoryService();
