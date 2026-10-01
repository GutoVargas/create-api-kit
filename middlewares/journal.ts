import type { Request, Response, NextFunction } from 'express';
import { pool } from '../databases/postgres.ts';

function sanitizeBody(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body;
  
  const sanitized = { ...(body as Record<string, unknown>) };
  const sensitiveKeys = ['password', 'token', 'secret', 'authorization', 'accessToken'];
  
  for (const key of sensitiveKeys) {
    if (key in sanitized) {
      sanitized[key] = '***';
    }
  }
  
  return sanitized;
}

export function journal(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', async () => {
    try {
      const sanitizedBody = sanitizeBody(req.body);

      await pool.query(
        `
          INSERT INTO api_journal (
            method,
            path,
            status_code,
            ip,
            user_agent,
            request_body
          )
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          req.method,
          req.originalUrl,
          res.statusCode,
          req.ip,
          req.get('user-agent') ?? null,
          JSON.stringify(sanitizedBody),
        ],
      );

      console.log(
        `[JOURNAL] ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`,
      );
    } catch (error) {
      console.error('[JOURNAL] Erro ao registrar requisição:', error);
    }
  });

  next();
}