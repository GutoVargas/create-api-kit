import 'dotenv/config';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { pool } from './postgres.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigrations(): Promise<void> {
  console.log('Iniciando migrações do banco de dados...');

  const migrationsDir = join(__dirname, './migrations/');
  const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

  for (const file of files) {
    const filePath = join(migrationsDir, file);
    const sql = readFileSync(filePath, 'utf-8');

    console.log(`Executando: ${file}`);
    try {
      await pool.query(sql);
      console.log(`Sucesso: ${file}`);
    } catch (error) {
      console.error(`Falha ao executar ${file}:`, (error as Error).message);
      await pool.end();
      process.exit(1);
    }
  }

  console.log('Todas as migrações foram aplicadas com sucesso.');
  await pool.end();
  process.exit(0);
}

runMigrations();