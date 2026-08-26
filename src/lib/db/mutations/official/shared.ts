export interface Queryable {
  query: (sql: string, params?: any[]) => Promise<any>;
}

export const officialProvider = 'euroleague_advanced' as const;
export const jsonPayload = (value: unknown): string => JSON.stringify(value ?? null);
