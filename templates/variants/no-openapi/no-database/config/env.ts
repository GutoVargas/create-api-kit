import 'dotenv/config';

const allowedEnvironments = ['development', 'production', 'test'];
const nodeEnvironment = process.env.NODE_ENV || 'development';

if (!allowedEnvironments.includes(nodeEnvironment)) {
  reportConfigurationError('NODE_ENV deve ser development, production ou test');
}

/** Converte e valida a porta HTTP configurada no ambiente. */
function readPort(): number {
  const rawValue = process.env.PORT;
  if (rawValue === undefined || rawValue === '') return 3000;
  const value = Number(rawValue);
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    reportConfigurationError('PORT deve ser um número inteiro entre 1 e 65535');
  }
  return value;
}

/** Exibe um erro de configuração e encerra o processo antes de iniciar a API. */
function reportConfigurationError(message: string): never {
  console.error(`Configuração de ambiente inválida: ${message}`);
  process.exit(1);
}

/** Remove espaços externos de uma origem CORS configurada. */
function normalizeOrigin(origin: string): string { return origin.trim(); }

/** Exclui entradas vazias da lista de origens CORS. */
function hasOrigin(origin: string): boolean { return origin.length > 0; }

export const env = {
  NODE_ENV: nodeEnvironment,
  PORT: readPort(),
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS ?? '',
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? '').split(',').map(normalizeOrigin).filter(hasOrigin),
};
