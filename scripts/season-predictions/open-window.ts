import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    season: { type: 'string' },
    phase: { type: 'string', default: 'preseason' },
    apply: { type: 'boolean', default: false },
    reopen: { type: 'boolean', default: false },
    hours: { type: 'string' },
  },
});

const usage = `Usage:
  npm run season-predictions:open -- --season <season-id> [--apply]
  npm run season-predictions:open -- --season <season-id> --reopen --hours <1-336> [--apply]
  npm run season-predictions:open -- --season <season-id> --phase playoffs [--apply]`;

const hours = values.hours === undefined ? undefined : Number(values.hours);
const phase = values.phase;
if (
  !values.season?.trim() ||
  (phase !== 'preseason' && phase !== 'playoffs') ||
  (values.reopen && (hours === undefined || phase !== 'preseason'))
) {
  console.error(usage);
  process.exit(2);
}

const {
  previewSeasonPredictionWindow,
  openSeasonPredictionWindow,
  previewPreseasonReopen,
  reopenPreseasonWindow,
  previewPlayoffsWindow,
  openPlayoffsWindow,
} = await import('../../src/features/season-predictions/server');
const { pool } = await import('../../src/lib/db/client');
const mode = values.apply ? 'apply' : 'preview';
try {
  if (values.reopen) {
    const preview = await previewPreseasonReopen(values.season, hours!);
    console.log(JSON.stringify({ mode, action: 'reopen', ...preview }, null, 2));
    if (values.apply) {
      const reopened = await reopenPreseasonWindow(values.season, hours!);
      console.log(JSON.stringify({ reopened }, null, 2));
    }
  } else if (phase === 'playoffs') {
    const preview = await previewPlayoffsWindow(values.season);
    console.log(JSON.stringify({ mode, phase, ...preview }, null, 2));
    if (values.apply) {
      const opened = await openPlayoffsWindow(values.season);
      console.log(JSON.stringify({ opened }, null, 2));
    }
  } else {
    const preview = await previewSeasonPredictionWindow(values.season);
    console.log(JSON.stringify({ mode, ...preview }, null, 2));
    if (values.apply) {
      const opened = await openSeasonPredictionWindow(values.season);
      console.log(JSON.stringify({ opened }, null, 2));
    }
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'No se pudo abrir la ventana.');
  process.exitCode = 1;
} finally {
  await pool.end();
}
