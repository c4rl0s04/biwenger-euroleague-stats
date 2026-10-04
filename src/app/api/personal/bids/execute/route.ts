import { executeScheduledPersonalBid, verifyPersonalBidWebhook } from '@/features/market/server';
import { privateJsonResponse } from '@/lib/utils/response';

export async function POST(request: Request) {
  const body = await request.text();
  if (
    body.length > 1024 ||
    !(await verifyPersonalBidWebhook(body, request.headers.get('Upstash-Signature'), request.url))
  ) {
    return privateJsonResponse({ message: 'No autorizado' }, 401);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return privateJsonResponse({ message: 'Solicitud inválida' }, 400);
  }
  const ruleId = parsed && typeof parsed === 'object' && 'ruleId' in parsed ? parsed.ruleId : null;
  if (typeof ruleId !== 'string')
    return privateJsonResponse({ message: 'Solicitud inválida' }, 400);
  // Every valid delivery is acknowledged; the database claim is the deduplication boundary.
  try {
    return privateJsonResponse({ result: await executeScheduledPersonalBid(ruleId) });
  } catch {
    console.error('Personal bid worker failed before completion');
    return privateJsonResponse({ message: 'Error de ejecución' }, 500);
  }
}
