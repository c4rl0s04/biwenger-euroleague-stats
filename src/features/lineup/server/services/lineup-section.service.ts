import 'server-only';
import { getManagerSquadData } from '@/features/managers/server';
import { mapLineupSection } from '../mappers/lineup-section.mapper';

export const LINEUP_SECTION_POLICY = Object.freeze({
  access: 'caller-resolved session user',
  cache: 'none',
  mutations: 'none',
});

export async function getLineupSectionData(userId?: string) {
  return mapLineupSection(userId ? await getManagerSquadData(userId) : null);
}
