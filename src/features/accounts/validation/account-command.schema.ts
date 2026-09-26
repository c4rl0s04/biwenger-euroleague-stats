import { z } from 'zod';
import type { ChangePasswordInput, LinkBiwengerInput } from '../models/account.models';

export class AccountValidationError extends Error {
  readonly statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'AccountValidationError';
  }
}

export const ChangePasswordInputSchema = z.object({
  currentPassword: z
    .string({ message: 'Faltan campos obligatorios' })
    .min(1, 'Faltan campos obligatorios'),
  newPassword: z
    .string({ message: 'Faltan campos obligatorios' })
    .min(1, 'Faltan campos obligatorios'),
});

export const LinkBiwengerInputSchema = z.object({
  password: z
    .string({ message: 'La contraseña de Biwenger es obligatoria.' })
    .min(1, 'La contraseña de Biwenger es obligatoria.'),
  email: z.string().email('Email no válido').optional().or(z.literal('')),
});

export function parseChangePasswordInput(raw: unknown): ChangePasswordInput {
  const parsed = ChangePasswordInputSchema.safeParse(raw);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message || 'Faltan campos obligatorios';
    throw new AccountValidationError(firstIssue);
  }
  return parsed.data;
}

export function parseLinkBiwengerInput(raw: unknown): LinkBiwengerInput {
  const parsed = LinkBiwengerInputSchema.safeParse(raw);
  if (!parsed.success) {
    const firstIssue =
      parsed.error.issues[0]?.message || 'La contraseña de Biwenger es obligatoria.';
    throw new AccountValidationError(firstIssue);
  }
  return {
    password: parsed.data.password,
    ...(parsed.data.email ? { email: parsed.data.email } : {}),
  };
}
