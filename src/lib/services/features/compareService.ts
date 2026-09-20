import 'server-only';
// Temporary Assistant compatibility contract. Task 20 retires this adapter after
// the remaining context builder adopts Compare's deliberate server entrypoint.
export { getCompareData, getCompareDataLite } from '@/features/compare/server';
export type { CompareDataResponse, CompareDataLiteResponse } from '@/features/compare/public';
export type { ComparisonSquadMember as UserSquadMember } from '@/features/managers/public';
