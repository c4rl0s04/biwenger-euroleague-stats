import type { MobileRecordRow } from '@/components/mobile/MobileRecordList';
export interface LineupSectionModel {
  playerCount: number;
  totalValue: number;
  risingCount: number;
  fallingCount: number;
  rows: MobileRecordRow[];
}
