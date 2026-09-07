import type {
  VolatilityStat,
  HeatCheckStat,
  HunterStat,
  RollingAverageStat,
  FloorCeilingStat,
  PointDistributionStat,
  DominanceStat,
  PositionChangeStat,
  ReliabilityStat,
} from '../../models/performance';
import type {
  VolatilityStatRecord,
  HeatCheckStatRecord,
  HunterStatRecord,
  RollingAverageStatRecord,
  FloorCeilingStatRecord,
  PointDistributionStatRecord,
  DominanceStatRecord,
  PositionChangeStatRecord,
  ReliabilityStatRecord,
} from '../queries/performance.records';

export const mapVolatilityStat = (row: VolatilityStatRecord): VolatilityStat => row;
export const mapHeatCheckStat = (row: HeatCheckStatRecord): HeatCheckStat => row;
export const mapHunterStat = (row: HunterStatRecord): HunterStat => row;
export const mapRollingAverageStat = (row: RollingAverageStatRecord): RollingAverageStat => row;
export const mapFloorCeilingStat = (row: FloorCeilingStatRecord): FloorCeilingStat => row;
export const mapPointDistributionStat = (row: PointDistributionStatRecord): PointDistributionStat =>
  row;
export const mapDominanceStat = (row: DominanceStatRecord): DominanceStat => row;
export const mapPositionChangeStat = (row: PositionChangeStatRecord): PositionChangeStat => row;
export const mapReliabilityStat = (row: ReliabilityStatRecord): ReliabilityStat => row;
