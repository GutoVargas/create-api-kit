import express, { type Express, type Request, type Response } from 'express';
import { pool } from './databases/postgres.ts';
import { journal } from './middlewares/journal.js';
import { errorHandler } from './middlewares/error-handler.js';

export function createApp(): Express {
  const app: Express = express();

  app.use(express.json());
  app.use(journal);

  app.get('/health', async (req: Request, res: Response) => {
    try {
      await pool.query('SELECT 1');
      res.status(200).json({ status: 'ok', database: 'connected' });
    } catch (error) {
      res.status(503).json({ status: 'error', database: 'disconnected' });
    }
  });

  app.get('/', (req: Request, res: Response) => {
    res.json({
      message: 'Hello World!',
      timestamp: new Date().toISOString(),
    });
  });

  app.use(errorHandler);

  return app;
}