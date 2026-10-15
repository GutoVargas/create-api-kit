import express, { type Express, type Request, type Response, type RequestHandler } from 'express';
import { errorHandler } from './middlewares/error-handler.js';
import { env } from './config/env.ts';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import hpp from 'hpp';
import { randomUUID } from 'node:crypto';
import swaggerUi from 'swagger-ui-express';
import { createOpenApiDocument } from './openapi.js';

/** Configura a API sem conexão de banco e registra as rotas básicas. */
export function createApp(): Express {
  const app: Express = express();
  app.disable('x-powered-by');
  app.use(assignRequestId);
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
  app.get('/docs.json', openApiJson);
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(createOpenApiDocument()));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

/** Retorna a especificação OpenAPI em JSON para ferramentas e clientes. */
const openApiJson: RequestHandler = (_req, res) => { res.json(createOpenApiDocument()); };

/** Atribui um identificador único a cada requisição recebida. */
const assignRequestId: RequestHandler = (req, _res, next) => {
  req.requestId = randomUUID();
  next();
};

/** Responde ao limite de requisições com o contrato JSON padrão da API. */
function rateLimitHandler(_req: Request, res: Response): void {
  res.status(429).json({ error: { message: 'Limite de requisições excedido', code: 'ERR_RATE_LIMIT' } });
}

/** Informa que a API está ativa e que nenhuma conexão de banco foi configurada. */
function healthCheck(_req: Request, res: Response): void {
  res.status(200).json({ status: 'ok', database: 'not_configured' });
}

/** Retorna uma mensagem básica e a hora atual da API. */
function home(_req: Request, res: Response): void {
  res.json({ message: 'Hello World!', timestamp: new Date().toISOString() });
}

/** Responde com o erro padronizado quando nenhuma rota corresponde ao caminho. */
function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: { message: 'Rota não encontrada', code: 'ERR_NOT_FOUND' } });
}
