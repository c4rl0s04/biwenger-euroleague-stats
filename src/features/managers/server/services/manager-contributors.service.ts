import 'server-only';
import type { ManagerContributorViewModel } from '../../models/manager-contributors';
import type { ManagerContributorRecord } from '../queries/manager-contributors.records';
import { readManagerContributors } from '../queries/manager-contributors.query';
import { mapManagerContributor } from '../mappers/manager-contributors.mapper';

export const MANAGER_CONTRIBUTORS_POLICY = Object.freeze({
  access: 'caller-resolved fantasy manager statistics; no account fields',
  validation: 'existing caller boundary; identity forwarded without coercion',
  serverCache: 'none',
  http: 'no dedicated endpoint; caller policy unchanged',
  mutations: 'none',
} as const);

export function createManagerContributorsService(
  read: (userId: string) => Promise<ManagerContributorRecord[]>
) {
  return async function getManagerContributorsData(
    userId: string
  ): Promise<ManagerContributorViewModel[]> {
    return (await read(userId)).map(mapManagerContributor);
  };
}

export const getManagerContributorsData = createManagerContributorsService(readManagerContributors);
