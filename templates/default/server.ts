import 'dotenv/config';

import { pool } from './databases/postgres.ts';
import { env } from './config/env.ts';
import { createApp } from './app.js';

const app = await createApp();

/** Registra no terminal que a API começou a aceitar conexões. */
function onServerStarted(): void {
  console.log(`API rodando na porta ${env.PORT}`);
  console.log(`Health check disponível em: http://localhost:${env.PORT}/health`);
}

/** Fecha o servidor e o pool do banco após receber um sinal de encerramento. */
const shutdown = async (signal: string): Promise<void> => {
  console.log(`\n${signal} recebido. Encerrando servidor...`);

  /** Finaliza o pool e encerra o processo após fechar as conexões HTTP. */
  const onServerClosed = async (): Promise<void> => {
    console.log('Servidor HTTP fechado.');

    await pool.end();
    console.log('Pool de conexões do banco de dados encerrado.');

    process.exit(0);
  };
  server.close(onServerClosed);

  /** Força o encerramento caso o desligamento gracioso ultrapasse o prazo. */
  const onShutdownTimeout = (): void => {
    console.error('Tempo limite excedido. Forçando encerramento do processo.');
    process.exit(1);
  };
  setTimeout(onShutdownTimeout, 10000);
};

/** Inicia o servidor HTTP na porta definida pelas variáveis de ambiente. */
const server = app.listen(env.PORT, onServerStarted);

/** Inicia o encerramento gracioso quando o processo recebe SIGINT. */
function onSigint(): void { void shutdown('SIGINT'); }

/** Inicia o encerramento gracioso quando o processo recebe SIGTERM. */
function onSigterm(): void { void shutdown('SIGTERM'); }

process.on('SIGINT', onSigint);
process.on('SIGTERM', onSigterm);
