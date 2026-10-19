import { AppError } from '../errors/app-error.js';

export interface ItemIdParams { id: number; }
export interface CreateItemInput { name: string; }

/** Valida e converte o parâmetro ID para um inteiro positivo. */
function parseItemId(value: unknown): ItemIdParams {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new AppError('Parâmetros inválidos', 400, 'ERR_VALIDATION');
  }
  const params = value as Record<string, unknown>;
  const id = Number(params.id);
  if (Object.keys(params).length !== 1 || !Number.isInteger(id) || id < 1) {
    throw new AppError('ID do item inválido', 400, 'ERR_VALIDATION');
  }
  return { id };
}

/** Valida o nome do item, remove espaços externos e rejeita propriedades adicionais. */
function parseCreateItem(value: unknown): CreateItemInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new AppError('Corpo da requisição inválido', 400, 'ERR_VALIDATION');
  }
  const body = value as Record<string, unknown>;
  if (Object.keys(body).length !== 1 || typeof body.name !== 'string') {
    throw new AppError('Informe somente o campo name', 400, 'ERR_VALIDATION');
  }
  const name = body.name.trim();
  if (!name || name.length > 120) {
    throw new AppError('O nome deve ter entre 1 e 120 caracteres', 400, 'ERR_VALIDATION');
  }
  return { name };
}

export const itemIdSchema = { parse: parseItemId };
export const createItemSchema = { parse: parseCreateItem };
