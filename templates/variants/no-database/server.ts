import 'dotenv/config';

import { env } from './config/env.ts';
import { createApp } from './app.js';

const app = createApp();

/** Registra no terminal que a API começou a aceitar conexões. */
function onServerStarted(): void {
  console.log(`API rodando na porta ${env.PORT}`);
  console.log(`Health check disponível em: http://localhost:${env.PORT}/health`);
}

/** Fecha o servidor HTTP após receber um sinal de encerramento. */
const shutdown = async (signal: string): Promise<void> => {
  console.log(`\n${signal} recebido. Encerrando servidor...`);

  /** Finaliza o processo depois que as conexões HTTP forem encerradas. */
  const onServerClosed = (): void => {
    console.log('Servidor HTTP fechado.');
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
