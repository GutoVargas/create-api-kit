import 'dotenv/config';

import { pool } from './databases/postgres.ts';
import { env } from './config/.env.ts';
import { createApp } from './app.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`API rodando na porta ${env.PORT}`);
  console.log(`Health check disponível em: http://localhost:${env.PORT}/health`);
});

// Graceful Shutdown (Desligamento Gracioso)
const shutdown = async (signal: string): Promise<void> => {
  console.log(`\n${signal} recebido. Encerrando servidor...`);
  
  server.close(async () => {
    console.log('Servidor HTTP fechado.');
    
    await pool.end();
    console.log('Pool de conexões do banco de dados encerrado.');
    
    process.exit(0);
  });

  // Fallback de segurança: forçar encerramento se não fechar em 10 segundos
  setTimeout(() => {
    console.error('Tempo limite excedido. Forçando encerramento do processo.');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));