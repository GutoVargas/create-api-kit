import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { ZodType } from 'zod';

type RequestPart = 'body' | 'query' | 'params';

/** Cria um middleware que valida body, query ou params com os schemas fornecidos. */
export function validateRequest(schemas: Partial<Record<RequestPart, ZodType>>): RequestHandler {
  /** Valida as partes configuradas da requisição e armazena os valores parseados em res.locals. */
  const validate: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
    res.locals.validated ??= {};
    for (const part of ['params', 'query', 'body'] as const) {
      const schema = schemas[part];
      if (!schema) continue;
      const result = schema.safeParse(req[part]);
      if (!result.success) {
        const error = new Error('Dados da requisição inválidos') as Error & { statusCode: number; code: string };
        error.statusCode = 400;
        error.code = 'ERR_VALIDATION';
        next(error);
        return;
      }
      res.locals.validated[part] = result.data;
    }
    next();
  };
  return validate;
}
