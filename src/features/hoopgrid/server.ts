import 'server-only';

export { HoopgridRepository, hoopgridRepository } from './server/repositories/hoopgrid.repository';
export { HoopgridCommandService, hoopgridCommandService } from './server/services/hoopgrid-command.service';
export { HoopgridReadService, hoopgridReadService } from './server/services/hoopgrid-read.service';

export type {
  CriteriaType,
  HoopgridCriteria,
  HoopgridChallenge,
  HoopgridChallengeSummary,
  HoopgridGuess,
  HoopgridTodayResponse,
  HoopgridCheatsheetPlayer,
  HoopgridCheatsheetSolution,
  HoopgridCheatsheetData,
  SubmitGuessInput,
  SubmitGuessResult,
  SubmitBatchGuessesInput,
  SubmitBatchGuessesResult,
} from './models/hoopgrid.models';

export {
  SubmitGuessInputSchema,
  SubmitBatchGuessesInputSchema,
  HoopgridDateQuerySchema,
  HoopgridValidationError,
  validateSubmitGuessInput,
  validateSubmitBatchGuessesInput,
  validateHoopgridDateQuery,
} from './validation/hoopgrid.schema';
