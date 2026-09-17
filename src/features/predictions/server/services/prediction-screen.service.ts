import 'server-only';
import { getPorrasStats } from './predictions-read.service';
import { mapPredictionSection } from '../mappers/prediction-screen.mapper';

/** Called after the existing mobile route guard; inherits the uncached read policy. */
export async function getPredictionSection(section: string) {
  return mapPredictionSection(await getPorrasStats(), section);
}
