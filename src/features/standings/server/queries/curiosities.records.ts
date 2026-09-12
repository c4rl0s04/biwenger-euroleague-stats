// Explicit serializable projection contracts; no untyped database records cross this boundary.
export type {
  BottlerStat as BottlerStatRecord,
  HeartbreakerStat as HeartbreakerStatRecord,
  NoGloryStat as NoGloryStatRecord,
  JinxStat as JinxStatRecord,
  EfficiencyStat as EfficiencyStatRecord,
  DetailedCaptainStat as DetailedCaptainStatRecord,
} from '../../models/curiosities';
