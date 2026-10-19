import express, { type Express, type Request, type Response, type RequestHandler } from 'express';
import { pool } from './databases/postgres.ts';
import { errorHandler } from './middlewares/error-handler.js';
import { journal } from './middlewares/journal.js';
import { env } from './config/env.ts';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import hpp from 'hpp';
import { itemsRouter } from './routes/items.js';
import { randomUUID } from 'node:crypto';
{{OPENAPI_IMPORTS}}

/** Monta o Express, configura a segurança global e registra as rotas da API. */
export function createApp(): Express {
  const app: Express = express();
  app.disable('x-powered-by');
  app.use(assignRequestId);
  app.use(journal);
  app.use(helmet());
  app.use(cors({ origin: env.allowedOrigins.length ? env.allowedOrigins : false }));
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: rateLimitHandler,
  }));
  app.use(express.json());
  app.use(hpp({ checkBody: true }));

  app.get('/health', healthCheck);

  app.get('/', home);

{{OPENAPI_ROUTES}}

  app.use('/items', itemsRouter);

  app.use(notFound);

  app.use(errorHandler);

  return app;
}

{{OPENAPI_HANDLER}}

/** Atribui um identificador único a cada requisição recebida. */
const assignRequestId: RequestHandler = (req, _res, next) => {
  req.requestId = randomUUID();
  next();
};

/** Responde ao limite de requisições com o contrato JSON padrão da API. */
function rateLimitHandler(_req: Request, res: Response): void {
  res.status(429).json({ error: { message: 'Limite de requisições excedido', code: 'ERR_RATE_LIMIT' } });
}

/** Verifica se o PostgreSQL está acessível e informa o estado do serviço. */
async function healthCheck(_req: Request, res: Response): Promise<void> {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
}

/** Retorna uma mensagem básica e a hora atual da API. */
function home(_req: Request, res: Response): void {
  res.json({ message: 'Hello World!', timestamp: new Date().toISOString() });
}

/** Responde com o erro padronizado quando nenhuma rota corresponde ao caminho. */
function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: { message: 'Rota não encontrada', code: 'ERR_NOT_FOUND' } });
}
