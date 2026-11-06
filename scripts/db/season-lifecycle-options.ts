import { parseArgs } from 'node:util';
import { z } from 'zod';

const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, 'Expected a real calendar date');
const season = z
  .string()
  .regex(/^\d{4}-\d{2}$/)
  .refine((value) => String(Number(value.slice(0, 4)) + 1).slice(-2) === value.slice(-2));

export function parseSeasonLifecycleArgs(args: string[]) {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      season: { type: 'string' },
      name: { type: 'string' },
      league: { type: 'string' },
      'euroleague-code': { type: 'string' },
      'start-date': { type: 'string' },
      'end-date': { type: 'string' },
    },
  });
  if (positionals.length !== 1 || !['freeze', 'create-next'].includes(positionals[0]))
    throw new Error('Use freeze or create-next with --season=YYYY-YY.');
  const id = season.parse(values.season);
  if (positionals[0] === 'freeze') return { command: 'freeze', season: id };
  const startDate = date.parse(values['start-date']);
  if (!startDate.startsWith(id.slice(0, 4)))
    throw new Error('Start date must match the season start year.');
  const euroleagueCode = values['euroleague-code'] || `E${id.slice(0, 4)}`;
  if (euroleagueCode !== `E${id.slice(0, 4)}`)
    throw new Error('EuroLeague code must match the season.');
  const endDate = values['end-date'] ? date.parse(values['end-date']) : null;
  if (endDate && endDate < startDate) throw new Error('End date must follow the start date.');
  return {
    command: 'create-next',
    season: id,
    name: values.name?.trim() || `EuroLeague Fantasy ${id}`,
    league: z
      .string()
      .regex(/^[1-9]\d*$/)
      .parse(values.league),
    euroleagueCode,
    startDate,
    endDate,
  };
}
