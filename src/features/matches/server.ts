import 'server-only';

export {
  getMatchRoundScreenData,
  getMatchesScreenData,
  MATCHES_ACCESS_POLICY,
  MATCHES_REVALIDATE_SECONDS,
} from './server/services/matches.service';
export {
  getOfficialPlayByPlayData,
  getOfficialShotData,
  MatchesInputError,
} from './server/services/official-game.service';
