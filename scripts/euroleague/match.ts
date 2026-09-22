import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import * as readline from 'node:readline/promises';
import {
  normalize,
  stripSuffix,
  type Candidate,
  type Mapping,
  type ManualOverride,
  manualOverrideSchema,
} from './types';

const OVERRIDES_FILE = fileURLToPath(new URL('./overrides.json', import.meta.url));

export async function loadOverrides(): Promise<Record<string, ManualOverride>> {
  try {
    const raw = await readFile(OVERRIDES_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    const overrides: Record<string, ManualOverride> = {};
    for (const [key, val] of Object.entries(parsed)) {
      overrides[key] = manualOverrideSchema.parse(val);
    }
    return overrides;
  } catch {
    return {};
  }
}

export async function saveOverride(key: string, override: ManualOverride): Promise<void> {
  const current = await loadOverrides();
  current[key] = override;
  await writeFile(OVERRIDES_FILE, JSON.stringify(current, null, 2) + '\n', 'utf8');
}

export interface MatchOptions {
  interactive?: boolean;
  overrides?: Record<string, ManualOverride>;
}

export async function matchPlayer(
  player: {
    name: string;
    teamCode: string | null;
    code: string;
    position?: string | null;
    height?: number | null;
    country?: string | null;
  },
  candidates: Candidate[],
  mappings: Mapping[],
  options: MatchOptions = {}
): Promise<{ id: number; method: string } | null> {
  // 1. Existing verified mapping
  const existing = mappings.filter((m) => m.provider_player_code === player.code);
  if (existing.length) {
    const m = existing[0];
    return existing.length === 1 &&
      m.status === 'matched' &&
      m.player_id &&
      candidates.some((c) => c.id === m.player_id)
      ? { id: m.player_id, method: 'existing_mapping' }
      : null;
  }

  if (!player.teamCode) return null;
  const teamCandidates = candidates.filter((c) => c.teamCode === player.teamCode);
  const overrides = options.overrides || (await loadOverrides());
  const overrideKey = `${player.teamCode}:${player.code}`;

  // 2. Persistent manual override
  if (overrides[overrideKey]) {
    const target = overrides[overrideKey];
    if (
      candidates.some((c) => c.id === target.targetId) &&
      !mappings.some(
        (m) => m.player_id === target.targetId && m.provider_player_code !== player.code
      )
    ) {
      return { id: target.targetId, method: 'manual_override' };
    }
  }

  // 3. Automated Tier 1: Existing euroleagueCode in candidate database row
  const byCode = teamCandidates.filter((c) => c.euroleagueCode && c.euroleagueCode === player.code);
  if (byCode.length === 1 && !mappings.some((m) => m.player_id === byCode[0].id)) {
    return { id: byCode[0].id, method: 'existing_euroleague_code' };
  }

  // 4. Automated Tier 2: Exact normalized name within verified team
  const byExact = teamCandidates.filter((c) => normalize(c.name) === normalize(player.name));
  if (byExact.length === 1 && !mappings.some((m) => m.player_id === byExact[0].id)) {
    return { id: byExact[0].id, method: 'exact_name_team' };
  }

  // 5. Automated Tier 3: Inverted tokens (e.g. 'Dossou-yovo Mathis' vs 'MATHIS DOSSOU-YOVO')
  const sWords = player.name
    .toUpperCase()
    .split(/[^A-Z]+/)
    .filter(Boolean)
    .sort()
    .join('');
  const byTokens = teamCandidates.filter((c) => {
    const cWords = c.name
      .toUpperCase()
      .split(/[^A-Z]+/)
      .filter(Boolean)
      .sort()
      .join('');
    return cWords.length > 3 && cWords === sWords;
  });
  if (byTokens.length === 1 && !mappings.some((m) => m.player_id === byTokens[0].id)) {
    return { id: byTokens[0].id, method: 'token_permutation_team' };
  }

  // 6. Automated Tier 4: Surname / generational suffix / single name match within verified team
  const siteNoSuffix = stripSuffix(player.name);
  const normSite = normalize(siteNoSuffix);
  const lastWordSite = normalize(player.name.trim().split(/\s+/).at(-1)!);

  const bySurname = teamCandidates.filter((c) => {
    const cNoSuffix = stripSuffix(c.name);
    const normC = normalize(cNoSuffix);
    if (normSite.endsWith(normC) || normC.endsWith(normSite)) return true;
    if (normSite.startsWith(normC) || normC.startsWith(normSite)) return true;
    if (lastWordSite === normC) return true;
    return false;
  });

  if (bySurname.length === 1 && !mappings.some((m) => m.player_id === bySurname[0].id)) {
    return { id: bySurname[0].id, method: 'surname_team' };
  }

  // 7. Interactive resolution if requested and terminal is interactive
  if (options.interactive && process.stdin.isTTY) {
    return await promptUserForResolution(player, teamCandidates, mappings, overrideKey);
  }

  return null;
}

async function promptUserForResolution(
  player: {
    name: string;
    teamCode: string | null;
    code: string;
    position?: string | null;
    height?: number | null;
    country?: string | null;
  },
  teamCandidates: Candidate[],
  mappings: Mapping[],
  overrideKey: string
): Promise<{ id: number; method: string } | null> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    console.log('\n────────────────────────────────────────────────────────────');
    console.log(`⚠️  MANUAL RESOLUTION NEEDED FOR:`);
    console.log(`   Web Player: ${player.name} (${player.teamCode})`);
    console.log(`   Code:       ${player.code}`);
    console.log(
      `   Bio:        ${player.position || 'N/A'} | Height: ${player.height ? player.height + ' cm' : 'N/A'} | Country: ${player.country || 'N/A'}`
    );
    console.log(`\nAvailable candidates in database for ${player.teamCode}:`);

    const available = teamCandidates.filter(
      (c) => !mappings.some((m) => m.player_id === c.id && m.provider_player_code !== player.code)
    );

    if (available.length === 0) {
      console.log('   (No unmapped candidates found in this team)');
    } else {
      available.forEach((c, idx) => {
        console.log(
          `   [${idx + 1}] ${c.name} (Biwenger ID: ${c.id}, Code: ${c.euroleagueCode || 'none'})`
        );
      });
    }
    console.log('   [id:<num>] Type custom Biwenger player ID (e.g. id:12345)');
    console.log('   [s] Skip / leave unresolved');
    console.log('────────────────────────────────────────────────────────────');

    const answer = (await rl.question('Select choice: ')).trim();

    if (answer.toLowerCase() === 's' || !answer) {
      console.log('Skipped.\n');
      return null;
    }

    let selectedCandidate: Candidate | undefined;
    if (answer.startsWith('id:')) {
      const customId = parseInt(answer.replace('id:', '').trim(), 10);
      selectedCandidate = teamCandidates.find((c) => c.id === customId) || {
        id: customId,
        name: `Custom ID ${customId}`,
        teamCode: player.teamCode,
      };
    } else {
      const num = parseInt(answer, 10);
      if (num >= 1 && num <= available.length) {
        selectedCandidate = available[num - 1];
      }
    }

    if (!selectedCandidate) {
      console.log('Invalid selection. Skipping.\n');
      return null;
    }

    const override: ManualOverride = {
      playerCode: player.code,
      teamCode: player.teamCode!,
      siteName: player.name,
      targetId: selectedCandidate.id,
      targetName: selectedCandidate.name,
      resolvedBy: 'manual_interactive',
    };

    await saveOverride(overrideKey, override);
    console.log(
      `✅ Matched "${player.name}" -> "${selectedCandidate.name}" (ID: ${selectedCandidate.id})`
    );
    console.log(`💾 Saved to overrides.json\n`);

    return { id: selectedCandidate.id, method: 'manual_override' };
  } finally {
    rl.close();
  }
}
