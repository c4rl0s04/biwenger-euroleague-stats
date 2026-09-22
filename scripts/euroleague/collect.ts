import { parseArgs } from 'node:util';
import { writeFile } from 'node:fs/promises';
import { chromium, type Page } from 'playwright';
import {
  type Asset,
  portraitUrl,
  collectionSchema,
  SEASON,
  DEFAULT_COLLECTION_PATH,
  normalizeEuroleaguePlayerCode,
  normalizeCountry,
  parseSpanishDate,
} from './types';

const { values } = parseArgs({
  options: {
    output: { type: 'string', default: DEFAULT_COLLECTION_PATH },
    headless: { type: 'boolean', default: true },
    rosters: { type: 'boolean', default: true },
  },
});

const origin = 'https://www.euroleaguebasketball.net';
const playerSelector = 'main a[href*="/players/"]';

async function season(page: Page) {
  const select = page
    .locator('select#season')
    .filter({ has: page.locator('option', { hasText: SEASON }) });
  if ((await select.count()) === 0) return;
  const s = select.first();
  await s.selectOption({ label: SEASON });
}

async function images(page: Page) {
  return page.locator(playerSelector).evaluateAll((links) =>
    links
      .filter((a) => /\/([a-z0-9]+)\/$/i.test(a.getAttribute('href') || ''))
      .map((a) => ({
        href: a.getAttribute('href')!,
        name: (a.textContent || '').trim().replace(/\s+/g, ' '),
        images: Array.from(a.querySelectorAll('img')).map((i) => ({
          alt: i.alt,
          source:
            i.getAttribute('data-srcset') ||
            i.getAttribute('srcset') ||
            i.getAttribute('data-src') ||
            i.getAttribute('src') ||
            '',
        })),
      }))
  );
}

interface ScrapedProfile {
  dorsal: string | null;
  position: string | null;
  height: number | null;
  country: string | null;
  birthDate: string | null;
  portraitCandidates: { alt: string; source: string }[];
}

async function scrapeProfile(page: Page): Promise<ScrapedProfile> {
  return page.evaluate(() => {
    const ldJsons = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(
      (s) => {
        try {
          return JSON.parse(s.textContent || '');
        } catch {
          return null;
        }
      }
    );
    const athlete = ldJsons.find((j) => j?.athlete)?.athlete;

    const ps = Array.from(document.querySelectorAll('p')).map((p) => p.textContent?.trim() || '');

    let dorsal: string | null = null;
    let position: string | null = null;
    const dorsalIdx = ps.findIndex((t) => /^#\d+$/.test(t));
    if (dorsalIdx !== -1) {
      dorsal = ps[dorsalIdx].replace('#', '');
      if (ps[dorsalIdx + 1] === '•' && ps[dorsalIdx + 2]) {
        position = ps[dorsalIdx + 2];
      }
    }

    let height: number | null = null;
    const alturaIdx = ps.findIndex((t) => t.toLowerCase() === 'altura');
    if (alturaIdx !== -1 && ps[alturaIdx + 1]) {
      const m = ps[alturaIdx + 1].match(/(\d+)\s*cm/i);
      if (m) height = parseInt(m[1], 10);
    }

    let country: string | null = athlete?.nationality || null;
    if (!country) {
      const nacIdx = ps.findIndex((t) => t.toLowerCase() === 'nacionalidad');
      if (nacIdx !== -1 && ps[nacIdx + 1]) country = ps[nacIdx + 1];
    }

    let birthDate: string | null = null;
    if (athlete?.birthDate) {
      birthDate = athlete.birthDate.split('T')[0];
    } else {
      const nacIdx = ps.findIndex((t) => t.toLowerCase() === 'nacido');
      if (nacIdx !== -1 && ps[nacIdx + 1]) {
        birthDate = ps[nacIdx + 1];
      }
    }

    const imgs = Array.from(document.querySelectorAll('main img'));
    const portraitCandidates = imgs.map((i) => ({
      alt: i.getAttribute('alt') || '',
      source:
        i.getAttribute('data-srcset') || i.getAttribute('srcset') || i.getAttribute('src') || '',
    }));

    return {
      dorsal,
      position,
      height,
      country,
      birthDate,
      portraitCandidates,
    };
  });
}

export async function collect(page: Page, rosterOnly = true) {
  console.log(`Starting EuroLeague official website scrape for ${SEASON}...`);
  await page.goto(`${origin}/es/euroleague/players/`, { waitUntil: 'domcontentloaded' });
  await page.locator('select#season').first().waitFor({ timeout: 20000 });
  await season(page);

  const teamLinks = await page
    .locator('a[href*="/teams/"][href*="/roster/"]')
    .evaluateAll((links) =>
      Array.from(
        new Map(
          links.map((a) => [
            a.getAttribute('href'),
            {
              href: a.getAttribute('href')!,
              name: a.querySelector('img')?.alt || a.textContent?.trim() || '',
              images: Array.from(a.querySelectorAll('img')).map((i) => ({
                alt: i.alt,
                source:
                  i.getAttribute('data-srcset') ||
                  i.getAttribute('srcset') ||
                  i.getAttribute('src') ||
                  '',
              })),
            },
          ])
        ).values()
      )
    );

  if (teamLinks.length !== 20) {
    throw new Error(`Expected 20 current teams, found ${teamLinks.length}`);
  }

  const assets: Asset[] = [];
  const directory: any[] = [];
  const missing: { name: string; reason: string }[] = [];
  const memberships = new Map<string, { code: string; name: string }>();

  console.log(`Extracting rosters from 20 teams...`);
  for (const team of teamLinks) {
    const code = team.href.split('/').filter(Boolean).at(-1)!.toUpperCase();
    const url = portraitUrl(team.name, team.images);
    if (url) {
      assets.push({
        kind: 'team',
        code,
        name: team.name,
        teamCode: code,
        teamName: team.name,
        page: origin + team.href,
        url,
      });
    } else {
      missing.push({ name: team.name, reason: 'No unique team logo found' });
    }

    await page.goto(origin + team.href, { waitUntil: 'domcontentloaded' });
    await season(page);
    await page.locator(playerSelector).first().waitFor({ timeout: 15000 });
    const roster = await images(page);
    if (roster.length < 5) throw new Error(`Incomplete roster: ${team.name}`);

    for (const p of roster) {
      const pcode = normalizeEuroleaguePlayerCode(p.href);
      if (memberships.has(pcode)) throw new Error(`Conflicting roster membership: ${pcode}`);
      memberships.set(pcode, { code, name: team.name });
      directory.push(p);
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  const uniquePlayers = Array.from(
    new Map(directory.map((p) => [normalizeEuroleaguePlayerCode(p.href), p])).values()
  );

  console.log(`Extracting profiles for ${uniquePlayers.length} unique players across 20 teams...`);

  for (let idx = 0; idx < uniquePlayers.length; idx++) {
    const p = uniquePlayers[idx];
    const code = normalizeEuroleaguePlayerCode(p.href);
    const portrait = p.images.find((i) => i.alt && !i.alt.startsWith('http'));
    const name = portrait?.alt || p.name;
    const playerPage = origin + p.href;

    let profile: ScrapedProfile = {
      dorsal: null,
      position: null,
      height: null,
      country: null,
      birthDate: null,
      portraitCandidates: [],
    };

    try {
      await page.goto(playerPage, { waitUntil: 'domcontentloaded' });
      profile = await scrapeProfile(page);
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
      try {
        await page.goto(playerPage, { waitUntil: 'domcontentloaded' });
        profile = await scrapeProfile(page);
      } catch (retryErr) {
        console.error(`Failed to visit profile for ${name}:`, retryErr);
      }
    }

    const birthDate = profile.birthDate
      ? profile.birthDate.includes('-')
        ? profile.birthDate
        : parseSpanishDate(profile.birthDate)
      : null;

    const country = normalizeCountry(profile.country);

    const url = portraitUrl(name, profile.portraitCandidates) || portraitUrl(name, p.images);

    assets.push({
      kind: 'player',
      code,
      name,
      teamCode: memberships.get(code)?.code || null,
      teamName: memberships.get(code)?.name || null,
      page: playerPage,
      url: url || null,
      country,
      birthDate,
      height: profile.height,
      dorsal: profile.dorsal,
      position: profile.position,
    });

    if ((idx + 1) % 25 === 0 || idx + 1 === uniquePlayers.length) {
      console.log(
        `[${idx + 1}/${uniquePlayers.length}] Scraped ${name} (${memberships.get(code)?.code || 'NONE'})`
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  return collectionSchema.parse({
    season: SEASON,
    complete: true,
    collectedAt: new Date().toISOString(),
    assets,
    missing,
    coverage: 'rosters',
  });
}

async function main() {
  const browser = await chromium.launch({ headless: values.headless ?? true });
  try {
    const page = await browser.newPage();
    const collection = await collect(page, values.rosters ?? true);
    await writeFile(values.output!, JSON.stringify(collection, null, 2) + '\n', 'utf8');
    console.log(`\n✅ Collection successfully saved to: ${values.output}`);
    console.log(
      `   Assets: ${collection.assets.length} (${collection.assets.filter((a) => a.kind === 'player').length} players, ${collection.assets.filter((a) => a.kind === 'team').length} teams)\n`
    );
  } finally {
    await browser.close();
  }
}

if (process.argv[1]?.endsWith('collect.ts')) {
  main().catch((err) => {
    console.error('Scrape collection failed:', err instanceof Error ? err.message : err);
    process.exitCode = 1;
  });
}
