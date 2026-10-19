import type { Request, Response, NextFunction, RequestHandler } from 'express';

type RequestPart = 'body' | 'query' | 'params';
interface ValueParser {
  /** Converte e valida uma parte desconhecida da requisição. */
  parse(value: unknown): unknown;
}

/** Cria um middleware para validar entradas com parsers manuais quando novos recursos forem adicionados. */
export function validateRequest(parsers: Partial<Record<RequestPart, ValueParser>>): RequestHandler {
  /** Valida os campos configurados e armazena os valores convertidos em res.locals. */
  const validate: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
    try {
      res.locals.validated ??= {};
      for (const part of ['params', 'query', 'body'] as const) {
        const parser = parsers[part];
        if (parser) res.locals.validated[part] = parser.parse(req[part]);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
  return validate;
}
