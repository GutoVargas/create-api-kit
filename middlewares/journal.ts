import type { Request, Response, NextFunction } from 'express';
import { pool } from '../databases/postgres.ts';

export function journal(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const start = Date.now();

  res.on('finish', async () => {
    try {
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
          req.body ?? null,
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