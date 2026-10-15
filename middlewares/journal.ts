import type { Request, Response, NextFunction } from 'express';
import { pool } from '../databases/postgres.ts';
import { randomUUID } from 'node:crypto';

const deniedKeys = new Set([
  'password', 'passwd', 'token', 'authtoken', 'accesstoken', 'refreshtoken',
  'jwt', 'secret', 'secretkey', 'clientsecret', 'authorization', 'cookie',
  'setcookie', 'apikey', 'credential', 'credentials', 'privatekey', 'sessionid',
  'cvv', 'cardnumber',
]);
/** Redige campos sensíveis recursivamente antes de persistir o corpo da requisição. */
function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) {
    const sanitizedItems: unknown[] = [];
    for (const item of value) sanitizedItems.push(sanitize(item));
    return sanitizedItems;
  }
  if (!value || typeof value !== 'object') return value;
  const sanitizedEntries: [string, unknown][] = [];
  for (const [key, item] of Object.entries(value)) {
    const normalized = key.replace(/[-_]/g, '').toLowerCase();
    sanitizedEntries.push([key, deniedKeys.has(normalized) ? '[REDACTED]' : sanitize(item)]);
  }
  return Object.fromEntries(sanitizedEntries);
}

/** Extrai o subject de um JWT sem verificar assinatura, somente para metadados do journal. */
function getTokenSubject(authorization: string | undefined): string | undefined {
  if (!authorization?.startsWith('Bearer ')) return undefined;
  try {
    const tokenPayload = authorization.slice(7).split('.')[1] ?? '';
    const payload: unknown = JSON.parse(Buffer.from(tokenPayload, 'base64url').toString());
    if (payload && typeof payload === 'object' && 'sub' in payload && typeof payload.sub === 'string') {
      return payload.sub;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

/** Registra método, caminho, status, origem, duração e identidade da requisição finalizada. */
export function journal(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();
  const requestId = req.requestId ?? randomUUID();
  res.setHeader('X-Request-Id', requestId);
  const authorization = req.get('authorization');
  const tokenUserId = getTokenSubject(authorization);
  const userId = req.get('x-user-id') ?? tokenUserId ?? null;

  /** Persiste os metadados da requisição depois que a resposta foi enviada. */
  async function recordCompletedRequest(): Promise<void> {
    try {
      await pool.query(
        `
          INSERT INTO api_journal (
            method,
            path,
            status_code,
            ip,
            user_agent,
            duration_ms,
            request_id,
            user_id,
            request_body
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
        [
          req.method,
          req.path,
          res.statusCode,
          req.ip,
          req.get('user-agent') ?? null,
          Number((process.hrtime.bigint() - start) / 1_000_000n),
          requestId,
          userId,
          JSON.stringify(sanitize(req.body)),
        ],
      );

      console.log(
        `[JOURNAL] ${req.method} ${req.originalUrl} ${res.statusCode} ${Number((process.hrtime.bigint() - start) / 1_000_000n)}ms`,
      );
    } catch (error) {
      console.error('[JOURNAL] Erro ao registrar requisição:', error);
    }
  }
  res.on('finish', recordCompletedRequest);

  next();
}
