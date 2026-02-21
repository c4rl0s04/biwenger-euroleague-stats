import { normalizePlayerName } from '../../../api/euroleague-client';

// Manual Overrides removed as per user request to favor interactive mapping.

/**
 * Service to find the correct Biwenger player for a given Euroleague player.
 */
export class PlayerMatcher {
  logger: any;

  constructor(logger?: any) {
    this.logger = logger || console;
  }

  /**
   * @param elPlayer - { code: '123', name: 'NAME, SURNAME', teamCode: 'MAD' }
   * @param biwengerPlayers - Array of all DB players
   * @param elTeamId - Biwenger Team ID if known
   * @returns Matched Biwenger Player or null
   */
  async findMatch(elPlayer: any, biwengerPlayers: any[], elTeamId: number | null) {
    const elCode = `P${elPlayer.code}`;
    const elName = elPlayer.name;
    const normalizedElName = normalizePlayerName(elName);

    // 1. Check DB Link (Persistent)
    const existingLink = biwengerPlayers.find((p: any) => p.euroleague_code === elCode);
    if (existingLink) {
      return existingLink; // Already Linked
    }

    // 2. Exact Name Match
    const match = biwengerPlayers.find(
      (p: any) => normalizePlayerName(p.name) === normalizedElName
    );
    if (match) return match;

    // 3. Interactive Mode (Fallback)
    if (elTeamId) {
      // Find candidates in the same team who are NOT yet linked to someone else
      const candidates = biwengerPlayers.filter(
        (p: any) => p.team_id === elTeamId && !p.euroleague_code
      );

      // Interactive Mode: Prompt User
      if (candidates.length > 0 && process.stdin.isTTY) {
        try {
          const prompts = (await import('prompts')).default;
          this.logger.log(
            `\n⚠️  Unmatched Euroleague Player: [${elCode}] ${elName} (Team ID: ${elTeamId})`
          );

          const choices = candidates.map((c: any) => ({
            title: `${c.name} (ID: ${c.id})`,
            value: c,
          }));
          choices.push({ title: 'Skip / No Match', value: null });

          const response = await prompts({
            type: 'select',
            name: 'selected',
            message: `Select matching Biwenger player for "${elName}":`,
            choices,
          });

          if (response.selected) {
            this.logger.log(`   ✅ User Selected: ${response.selected.name}`);
            return response.selected;
          }
        } catch (e: any) {
          this.logger.error('Failed to prompt: ' + e.message);
        }
      }
    }

    return null; // No match found
  }
}
