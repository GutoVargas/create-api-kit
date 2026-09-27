import 'dotenv/config';

import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from 'express';

import { journal } from './middlewares/journal.ts';

const app: Express = express();

app.use(express.json());

app.use(journal);

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Hello World!',
  });
});

app.use(
  (err: Error, req: Request, res: Response, next: NextFunction) => {
    res.status(400).send(err.message);
  },
);

const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
  console.log(`API rodando na porta ${port}`);
});