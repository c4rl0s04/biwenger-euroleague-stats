// Screens
export { DesktopHoopgridScreen } from './screens/DesktopHoopgridScreen';
export { MobileHoopgridScreen } from './screens/MobileHoopgridScreen';
export { HoopgridCheatsheetScreen } from './screens/HoopgridCheatsheetScreen';
export { HoopgridCriteriaScreen } from './screens/HoopgridCriteriaScreen';

// Components
export { default as HoopgridClient } from './components/HoopgridClient';
export { default as HoopgridHeader } from './components/HoopgridHeader';
export { default as HoopgridStats } from './components/HoopgridStats';
export { default as HoopgridBoard } from './components/HoopgridBoard';
export { default as GridCell } from './components/GridCell';
export { default as HoopgridInstructions } from './components/HoopgridInstructions';
export { default as HoopgridSearch } from './components/HoopgridSearch';
export { default as HoopgridShareModal } from './components/HoopgridShareModal';
export { default as HoopgridCalendar } from './components/HoopgridCalendar';
export { default as HoopgridCheatsheetHeader } from './components/HoopgridCheatsheetHeader';

// Hooks
export { useHoopgridGame } from './hooks/useHoopgridGame';
export { useHoopgridShare } from './hooks/useHoopgridShare';

// Constants
export {
  HOOPGRID_POSITIONS,
  HOOPGRID_STATS,
  HOOPGRID_MARKET,
  HOOPGRID_OWNERSHIP,
  HOOPGRID_COUNTRIES,
  HOOPGRID_HEIGHT,
  HOOPGRID_AGE,
} from './constants/hoopgrid-criteria';

// Models
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

// Validation
export {
  SubmitGuessInputSchema,
  SubmitBatchGuessesInputSchema,
  HoopgridDateQuerySchema,
  HoopgridValidationError,
  validateSubmitGuessInput,
  validateSubmitBatchGuessesInput,
  validateHoopgridDateQuery,
} from './validation/hoopgrid.schema';
