/** Narrow fixture projection: short names and provider display codes are compatibility contracts. */
export interface ScheduleRoundOption {
  roundId: number | null;
  roundName: string | null;
  firstMatchDate?: string | null;
}
export interface ScheduleFixture {
  id: number;
  date: string | null;
  homeId: number | null;
  awayId: number | null;
  homeName: string | null;
  awayName: string | null;
  homeCode: string | null;
  awayCode: string | null;
}
