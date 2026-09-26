import { z } from 'zod';
import type {
  SellPlayerInput,
  SellAllInput,
  WithdrawPlayerInput,
  AcceptOfferInput,
  RejectOfferInput,
} from '../models/market-command.models';

export class MarketCommandValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MarketCommandValidationError';
  }
}

export const sellPlayerInputSchema = z.object({
  playerId: z.coerce
    .number({ message: 'ID de jugador faltante o inválido' })
    .int('ID de jugador debe ser un entero')
    .positive('ID de jugador faltante o inválido'),
  price: z.coerce
    .number({ message: 'Precio de venta faltante o inválido' })
    .int('El precio de venta debe ser un entero')
    .nonnegative('El precio de venta debe ser mayor o igual a 0'),
  type: z.enum(['sell', 'immediateSell']).optional().default('sell'),
});

export const sellAllInputSchema = z.object({
  pricePercentage: z.coerce
    .number({ message: 'Porcentaje de precio inválido' })
    .int('El porcentaje debe ser un entero')
    .min(1, 'El porcentaje debe ser al menos 1%')
    .max(500, 'El porcentaje máximo permitido es 500%')
    .optional()
    .default(100),
});

export const withdrawPlayerInputSchema = z.object({
  playerId: z.coerce
    .number({ message: 'ID de jugador no proporcionado' })
    .int('ID de jugador debe ser un entero')
    .positive('ID de jugador no proporcionado'),
});

export const acceptOfferInputSchema = z.object({
  offerId: z.coerce
    .number({ message: 'ID de oferta no proporcionado' })
    .int('ID de oferta debe ser un entero')
    .positive('ID de oferta no proporcionado'),
  playerId: z.coerce
    .number({ message: 'ID de jugador debe ser un número' })
    .int('ID de jugador debe ser un entero')
    .positive('ID de jugador debe ser positivo')
    .optional(),
});

export const rejectOfferInputSchema = z.object({
  offerId: z.coerce
    .number({ message: 'ID de oferta no proporcionado' })
    .int('ID de oferta debe ser un entero')
    .positive('ID de oferta no proporcionado'),
});

export function validateSellPlayerInput(input: unknown): SellPlayerInput {
  if (!input || typeof input !== 'object') {
    throw new MarketCommandValidationError('Se requiere un objeto de parámetros válido');
  }
  const result = sellPlayerInputSchema.safeParse(input);
  if (!result.success) {
    throw new MarketCommandValidationError(
      result.error.issues[0]?.message || 'Parámetros de venta no válidos'
    );
  }
  return result.data as SellPlayerInput;
}

export function validateSellAllInput(input: unknown): SellAllInput {
  const result = sellAllInputSchema.safeParse(input ?? {});
  if (!result.success) {
    throw new MarketCommandValidationError(
      result.error.issues[0]?.message || 'Parámetros de venta masiva no válidos'
    );
  }
  return result.data as SellAllInput;
}

export function validateWithdrawPlayerInput(input: unknown): WithdrawPlayerInput {
  if (!input || typeof input !== 'object') {
    throw new MarketCommandValidationError('Se requiere un objeto de parámetros válido');
  }
  const result = withdrawPlayerInputSchema.safeParse(input);
  if (!result.success) {
    throw new MarketCommandValidationError(
      result.error.issues[0]?.message || 'ID de jugador no proporcionado'
    );
  }
  return result.data as WithdrawPlayerInput;
}

export function validateAcceptOfferInput(input: unknown): AcceptOfferInput {
  if (!input || typeof input !== 'object') {
    throw new MarketCommandValidationError('Se requiere un objeto de parámetros válido');
  }
  const result = acceptOfferInputSchema.safeParse(input);
  if (!result.success) {
    throw new MarketCommandValidationError(
      result.error.issues[0]?.message || 'ID de oferta no proporcionado'
    );
  }
  return result.data as AcceptOfferInput;
}

export function validateRejectOfferInput(input: unknown): RejectOfferInput {
  if (!input || typeof input !== 'object') {
    throw new MarketCommandValidationError('Se requiere un objeto de parámetros válido');
  }
  const result = rejectOfferInputSchema.safeParse(input);
  if (!result.success) {
    throw new MarketCommandValidationError(
      result.error.issues[0]?.message || 'ID de oferta no proporcionado'
    );
  }
  return result.data as RejectOfferInput;
}
