/**
 * Backward compatibility adapter for legacy consumers.
 * Re-exports the safe lineup mapper from src/features/lineup/server.
 */
import { mapToSafeLineupResponse } from '@/features/lineup/server';

export { mapToSafeLineupResponse as createSafeLineupResponse };
