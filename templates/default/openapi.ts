import { extendZodWithOpenApi, OpenApiGeneratorV3, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { createItemSchema, itemIdSchema } from './schemas/item-schemas.js';

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

const itemSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  created_at: z.string().datetime().nullable(),
});
const itemResponseSchema = z.object({ data: itemSchema });
const itemListResponseSchema = z.object({ data: z.array(itemSchema) });
const errorResponseSchema = z.object({
  error: z.object({ message: z.string(), code: z.string() }),
});

registry.registerPath({
  method: 'get', path: '/health', summary: 'Verifica a API e a conexão PostgreSQL',
  responses: { 200: { description: 'API e banco disponíveis' }, 503: { description: 'Banco indisponível' } },
});
registry.registerPath({
  method: 'get', path: '/', summary: 'Informações básicas da API',
  responses: { 200: { description: 'Mensagem e timestamp da API' } },
});
registry.registerPath({
  method: 'get', path: '/items', summary: 'Lista itens',
  responses: { 200: { description: 'Lista de itens', content: { 'application/json': { schema: itemListResponseSchema } } } },
});
registry.registerPath({
  method: 'post', path: '/items', summary: 'Cria um item',
  request: { body: { required: true, content: { 'application/json': { schema: createItemSchema } } } },
  responses: {
    201: { description: 'Item criado', content: { 'application/json': { schema: itemResponseSchema } } },
    400: { description: 'Payload inválido', content: { 'application/json': { schema: errorResponseSchema } } },
  },
});
registry.registerPath({
  method: 'get', path: '/items/{id}', summary: 'Consulta um item', request: { params: itemIdSchema },
  responses: {
    200: { description: 'Item encontrado', content: { 'application/json': { schema: itemResponseSchema } } },
    404: { description: 'Item não encontrado' },
  },
});
registry.registerPath({
  method: 'put', path: '/items/{id}', summary: 'Atualiza um item',
  request: { params: itemIdSchema, body: { required: true, content: { 'application/json': { schema: createItemSchema } } } },
  responses: {
    200: { description: 'Item atualizado', content: { 'application/json': { schema: itemResponseSchema } } },
    400: { description: 'Payload inválido', content: { 'application/json': { schema: errorResponseSchema } } },
    404: { description: 'Item não encontrado' },
  },
});
registry.registerPath({
  method: 'delete', path: '/items/{id}', summary: 'Remove um item', request: { params: itemIdSchema },
  responses: { 204: { description: 'Item removido' }, 404: { description: 'Item não encontrado' } },
});

/** Gera a especificação OpenAPI consumida pela interface interativa Swagger UI. */
export function createOpenApiDocument() {
  return new OpenApiGeneratorV3(registry.definitions).generateDocument({
    openapi: '3.0.0',
    info: { title: '{{PROJECT_NAME}}', version: '1.0.0', description: 'Documentação interativa da API.' },
  });
}
