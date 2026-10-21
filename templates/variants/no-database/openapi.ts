import { extendZodWithOpenApi, OpenApiGeneratorV3, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();
const registeredDynamicPaths = new Set<string>();
registry.registerPath({
  method: 'get', path: '/health', summary: 'Verifica o estado da API',
  responses: { 200: { description: 'API disponível; banco não configurado' } },
});
registry.registerPath({
  method: 'get', path: '/', summary: 'Informações básicas da API',
  responses: { 200: { description: 'Mensagem e timestamp da API' } },
});

/** Gera a especificação OpenAPI da variante sem banco de dados. */
export function createOpenApiDocument(additionalPaths: Record<string, unknown>[] = []) {
  for (const path of additionalPaths) {
    const key = JSON.stringify(path);
    if (!registeredDynamicPaths.has(key)) {
      registry.registerPath(path as Parameters<typeof registry.registerPath>[0]);
      registeredDynamicPaths.add(key);
    }
  }
  return new OpenApiGeneratorV3(registry.definitions).generateDocument({
    openapi: '3.0.0',
    info: { title: '{{PROJECT_NAME}}', version: '1.0.0', description: 'Documentação interativa da API.' },
  });
}
