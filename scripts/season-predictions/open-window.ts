import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    season: { type: 'string' },
    apply: { type: 'boolean', default: false },
  },
});

if (!values.season?.trim()) {
  console.error('Usage: npm run season-predictions:open -- --season <season-id> [--apply]');
  process.exit(2);
}

const { previewSeasonPredictionWindow, openSeasonPredictionWindow } =
  await import('../../src/features/season-predictions/server');
const { pool } = await import('../../src/lib/db/client');
try {
  const preview = await previewSeasonPredictionWindow(values.season);
  console.log(JSON.stringify({ mode: values.apply ? 'apply' : 'preview', ...preview }, null, 2));
  if (values.apply) {
    const opened = await openSeasonPredictionWindow(values.season);
    console.log(JSON.stringify({ opened }, null, 2));
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'No se pudo abrir la ventana.');
  process.exitCode = 1;
} finally {
  await pool.end();
}
