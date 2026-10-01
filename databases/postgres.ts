import { Pool, type PoolClient } from 'pg';
import { env } from '../config/.env.ts';

export const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
});

pool.on('error', (err) => {
  console.error('Erro inesperado no cliente PostgreSQL:', err);
  process.exit(-1);
});

export async function getClient(): Promise<PoolClient> {
  const client = await pool.connect();
  return client;
}