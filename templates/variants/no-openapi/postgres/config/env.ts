import 'dotenv/config';

const allowedEnvironments = ['development', 'production', 'test'];
const nodeEnvironment = process.env.NODE_ENV || 'development';

if (!allowedEnvironments.includes(nodeEnvironment)) {
  reportConfigurationError('NODE_ENV deve ser development, production ou test');
}

/** Lê uma variável obrigatória ou encerra a inicialização com mensagem objetiva. */
function requiredValue(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) reportConfigurationError(`${name} é obrigatório`);
  return value!;
}

/** Converte e valida uma porta TCP configurada no ambiente. */
function readPort(name: string, fallback: number): number {
  const rawValue = process.env[name];
  if (rawValue === undefined || rawValue === '') return fallback;
  const value = Number(rawValue);
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    reportConfigurationError(`${name} deve ser um número inteiro entre 1 e 65535`);
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
  PORT: readPort('PORT', 3000),
  DB_HOST: requiredValue('DB_HOST'),
  DB_PORT: readPort('DB_PORT', 5432),
  DB_NAME: requiredValue('DB_NAME'),
  DB_USER: requiredValue('DB_USER'),
  DB_PASSWORD: requiredValue('DB_PASSWORD'),
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS ?? '',
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? '').split(',').map(normalizeOrigin).filter(hasOrigin),
};
