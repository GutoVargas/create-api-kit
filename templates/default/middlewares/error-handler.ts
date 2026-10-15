import type { Request, Response, NextFunction } from 'express';

/** Converte erros da aplicação em respostas JSON seguras e encaminha erros após o envio de headers. */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = Number((err as Error & { statusCode?: number; status?: number }).statusCode ?? (err as Error & { status?: number }).status) || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  const message = isProduction && statusCode >= 500 ? 'Erro interno do servidor' : err.message || 'Erro interno do servidor';
  const candidateCode = (err as Error & { code?: string }).code;
  const code = candidateCode && /^ERR_[A-Z0-9_]+$/.test(candidateCode)
    ? candidateCode
    : statusCode >= 500 ? 'ERR_INTERNAL' : 'ERR_REQUEST';

  res.status(statusCode).json({
    error: { message, code },
  });
}
