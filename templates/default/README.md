# {{PROJECT_NAME}}

API REST com Express, TypeScript e PostgreSQL, gerada pelo `create-api-kit`.

## Requisitos

- Node.js 20 ou superior e npm.
- Docker com Docker Compose para executar a stack em containers; ou PostgreSQL instalado para desenvolvimento local.

## Começar a desenvolver

```sh
cp .env.example .env
```

Defina `DB_PASSWORD` em `.env`. O CORS bloqueia origens por padrão; para liberar uma aplicação web, informe as origens em `ALLOWED_ORIGINS`, separadas por vírgula, por exemplo `http://localhost:5173,https://app.example.com`.

### Com Docker Compose

```sh
docker compose up --build
```

O Compose inicia o PostgreSQL, aguarda o health check do banco, aplica as migrations e inicia a API. Para encerrar, use `docker compose down`. Os dados do PostgreSQL ficam no volume nomeado `postgres_data`.

### Desenvolvimento local

Instale as dependências e configure `DB_HOST=localhost` no `.env`. Inicie o PostgreSQL e crie um banco e usuário correspondentes a `DB_NAME`, `DB_USER` e `DB_PASSWORD`.

```sh
npm install
npm run migrate
npm run dev
```

`npm run dev` inicia o servidor com recarga automática. Para validar a compilação TypeScript, execute `npm run build`; para executar a versão compilada, use `npm start`.

## Passo a passo após instalar

1. Copie `.env.example` para `.env` e defina `DB_PASSWORD` e, se necessário, `ALLOWED_ORIGINS`.
2. Execute `docker compose up --build` para iniciar o PostgreSQL e a API. O Compose aplica as migrations antes de iniciar o servidor.
<!-- OPENAPI_ONLY_START -->
3. Abra [http://localhost:3000/docs](http://localhost:3000/docs) no navegador. A interface Swagger UI lista as operações disponíveis.
4. Expanda uma rota, selecione **Try it out**, informe parâmetros ou JSON e clique em **Execute**. A resposta HTTP aparece na própria página, sem precisar instalar um cliente separado.
5. Para desenvolver, adicione schemas em `schemas/`, implemente as camadas e exporte `openApiPaths` no arquivo de rota. O carregador agrega essas operações antes de montar `/docs` e `/docs.json`.
<!-- OPENAPI_ONLY_END -->
<!-- NO_OPENAPI_START -->
3. A API inicia sem OpenAPI, Swagger UI ou Zod. Valide entradas com parsers manuais em `schemas/`.
4. Para desenvolver, adicione parsers em `schemas/`, implemente as camadas da aplicação e registre as rotas. A opção sem essa feature não instala dependências de documentação ou Zod.
<!-- NO_OPENAPI_END -->

<!-- OPENAPI_ONLY_START -->
A especificação OpenAPI em JSON também fica disponível em `/docs.json`. A rota Swagger UI chama a API na mesma origem, então não é necessário liberar uma origem CORS adicional para acessá-la localmente.
<!-- OPENAPI_ONLY_END -->

## Estrutura do projeto

```text
.
├── app.ts                       # Configuração do Express, middlewares e rotas
<!-- OPENAPI_ONLY_START -->
├── openapi.ts                   # Especificação OpenAPI gerada dos schemas Zod
<!-- OPENAPI_ONLY_END -->
├── server.ts                    # Inicialização HTTP e encerramento gracioso
├── config/
│   └── env.ts                   # Leitura e validação das variáveis de ambiente
├── databases/
│   ├── postgres.ts              # Pool e conexões PostgreSQL
│   ├── migrate.ts               # Executor das migrations SQL
│   └── migrations/              # Scripts SQL versionados
├── middlewares/
│   ├── error-handler.ts         # Resposta padronizada para erros
│   ├── journal.ts               # Auditoria das requisições
│   └── validate.ts              # Utilitário de validação das entradas
├── routes/
│   ├── loader.ts                 # Descobre e registra *.route.ts automaticamente
<!-- CRUD_ONLY_START -->
│   └── items.route.ts            # Router de exemplo registrado pelo carregador
├── controllers/
│   └── item-controller.ts       # HTTP: traduz request em chamada de serviço
├── services/
│   └── item-service.ts          # Regras de negócio e transações
├── repositories/
│   └── item-repository.ts       # Consultas e comandos SQL
├── models/
│   └── item.ts                  # Entidade Item com getters e setters
├── schemas/
│   └── item-schemas.ts          # Validação de entrada; Zod na opção OpenAPI
├── errors/
│   └── app-error.ts             # Erros de aplicação com status e código
<!-- CRUD_ONLY_END -->
├── types/
│   └── express.d.ts             # Extensões dos tipos do Express
├── Dockerfile
├── compose.yml
├── .env.example
└── tsconfig.json
```

### Arquitetura e responsabilidades

Quando um recurso segue a arquitetura em camadas, o fluxo é `routes → middlewares → controller → service → repository → PostgreSQL`; a resposta percorre o caminho de volta. `app.ts` registra as rotas encontradas e os middlewares globais.

- **Routes:** declaram caminhos HTTP, aplicam schemas e encaminham para o controller. Não contêm regras de negócio nem SQL.
- **Controllers:** leem valores validados, chamam um serviço e definem status e formato HTTP. Encaminham erros com `next(error)`.
- **Services:** implementam regras de negócio e coordenam transações quando uma operação grava dados.
- **Repositories:** isolam as consultas SQL e convertem registros do banco em entidades.
- **Models:** representam entidades e protegem seus invariantes. No CRUD de exemplo, `Item` mantém campos privados (`_id`, `_name`, `_createdAt`), expõe getters e setters e valida os valores atribuídos. `toJSON()` define o formato enviado pela API.
- **Schemas:** definem os formatos permitidos para body, params e query com Zod na opção OpenAPI ou parsers manuais na opção sem OpenAPI.
- **Errors:** a camada de erros pode carregar status HTTP e códigos sem misturar detalhes de transporte com SQL.

Toda função, método, getter, setter e callback nomeado deve ter um comentário JSDoc imediatamente acima descrevendo seu propósito. Documente também parâmetros, retorno e efeitos colaterais quando não forem evidentes pela assinatura.

### Adicionar e registrar rotas dinamicamente

O carregador procura automaticamente arquivos `*.route.ts` dentro de `routes/` (em produção, `*.route.js`). Cada arquivo deve exportar `routePath` e um router como exportação padrão. Assim, não é necessário editar `app.ts` para montar um novo router. Para o Swagger, exporte também `openApiPaths`: o servidor agrega essas definições ao documento automaticamente durante a inicialização. O Express não infere schemas, parâmetros e respostas a partir dos handlers, então descreva cada operação explicitamente.

Exemplo de `routes/products.route.ts`:

```ts
import { Router, type Request, type Response } from 'express';

const router = Router();

/** Prefixo para todas as rotas deste recurso. */
export const routePath = '/products';

/** Lista os produtos do recurso. */
function listProducts(_req: Request, res: Response): void {
  res.json({ data: [] });
}

router.get('/', listProducts);

/** Documenta as operações deste router no OpenAPI quando a feature estiver habilitada. */
export const openApiPaths = [{
  method: 'get',
  path: '/products',
  summary: 'Lista os produtos disponíveis',
  responses: { 200: { description: 'Lista de produtos' } },
}];


export default router;
```

Use o caminho completo da API (`/products`), não o caminho relativo do router (`/`). Essa propriedade é ignorada em projetos gerados sem OpenAPI. Depois de adicionar ou alterar `openApiPaths`, reinicie `npm run dev` e confira `/docs.json` ou atualize `/docs`.

<!-- OPENAPI_ONLY_START -->
<!-- CRUD_ONLY_START -->
### Tutorial: adicionar um recurso do início ao fim

O exemplo abaixo cria `products` com `GET /products` e `POST /products`. Abra a raiz do projeto no editor. Cada caminho começa nessa pasta e cada bloco vai somente no arquivo citado no passo. Os imports que terminam em `.js` são intencionais: o TypeScript deste template os resolve para os arquivos `.ts`. O carregador encontra as rotas ao iniciar; não edite `app.ts`.

#### Como uma requisição atravessa as camadas

```text
Cliente HTTP → route → Zod/validateRequest → controller → service → repository → PostgreSQL
     ↑                                                                              ↓
     └──────────────────── response JSON / status HTTP ────────────────────────────┘
```

`route` escolhe método e caminho; `validateRequest` rejeita dados inválidos antes de chamar o controller; `controller` traduz HTTP para uma chamada de service; `service` executa regras do domínio; `repository` executa SQL. A resposta percorre o caminho inverso. Se uma etapa falhar, `next(error)` entrega o erro ao middleware global.

#### 1. Crie a tabela

Adicione uma migration com o próximo número livre em `databases/migrations/`, por exemplo `003_create_products.sql` (o template já usa `002` para `items`):

```sql
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

No desenvolvimento local, rode `npm run migrate`. Com Docker Compose, execute `docker compose up --build` para reconstruir e iniciar a API; o comando de inicialização aplica migrations antes de iniciar o servidor. Não edite uma migration que já foi aplicada em outro ambiente.

#### 2. Defina o tipo da linha do banco

Crie `models/product.ts`. O tipo representa os dados retornados pelo PostgreSQL; os tipos de entrada da API serão inferidos do Zod no próximo passo.

```ts
export interface Product {
  id: number;
  name: string;
  created_at: Date | string;
}
```

#### 3. Valide entradas e infira tipos com Zod

Crie `schemas/product-schemas.ts`. `z.infer` mantém o tipo TypeScript alinhado com a validação: não declare outro tipo manual para o mesmo body. `trim`, `min` e `max` também normalizam e restringem o texto recebido.

```ts
import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().trim().min(1).max(120),
}).strict();

export type CreateProductInput = z.infer<typeof createProductSchema>;
```

Para parâmetros, defina outro schema e infira seu tipo: `const productIdSchema = z.object({ id: z.coerce.number().int().positive() }).strict();` e `type ProductIdParams = z.infer<typeof productIdSchema>;`. `z.coerce.number()` converte o `id` textual do URL para `number` depois da validação.

#### 4. Implemente o repository

Crie `repositories/product-repository.ts`. Esta camada conhece SQL e PostgreSQL, mas não Express nem regras HTTP.

```ts
import { pool } from '../databases/postgres.js';
import type { Product } from '../models/product.js';

export class ProductRepository {
  /** Lista os produtos persistidos. */
  async findAll(): Promise<Product[]> {
    const result = await pool.query<Product>(
      'SELECT id, name, created_at FROM products ORDER BY id',
    );
    return result.rows.map((row) => ({ ...row, id: Number(row.id) }));
  }

  /** Insere um produto e retorna a linha criada pelo PostgreSQL. */
  async insert(name: string): Promise<Product> {
    const result = await pool.query<Product>(
      'INSERT INTO products (name) VALUES ($1) RETURNING id, name, created_at',
      [name],
    );
    const row = result.rows[0]!;
    return { ...row, id: Number(row.id) };
  }
}
```

Use parâmetros `$1`, `$2` nas consultas; não concatene valores recebidos em strings SQL. O PostgreSQL pode devolver uma coluna `BIGSERIAL` como texto, por isso o exemplo converte `id` para `number`. Se uma operação precisar de várias queries atômicas, receba um `PoolClient` no repository e coordene `BEGIN`, `COMMIT`, `ROLLBACK` e `release()` no service, como em `ItemService`.

#### 5. Coloque as regras no service

Crie `services/product-service.ts`. O service orquestra o repository e aplica regras do domínio; ele não recebe `Request` ou `Response`.

```ts
import { ProductRepository } from '../repositories/product-repository.js';
import type { Product } from '../models/product.js';

export class ProductService {
  /** Recebe o acesso a dados usado pelas operações de produto. */
  constructor(private readonly repository: ProductRepository) {}

  /** Lista os produtos disponíveis. */
  list(): Promise<Product[]> {
    return this.repository.findAll();
  }

  /** Cria um produto com o nome já validado pelo schema de entrada. */
  create(name: string): Promise<Product> {
    return this.repository.insert(name);
  }
}
```

#### 6. Traduza HTTP para chamadas do service no controller

Crie `controllers/product-controller.ts`. O middleware `validateRequest` coloca os dados parseados em `res.locals.validated`; o controller usa o tipo inferido de Zod. Erros seguem para o handler global com `next(error)`.

```ts
import type { NextFunction, Request, Response } from 'express';
import type { CreateProductInput } from '../schemas/product-schemas.js';
import { ProductService } from '../services/product-service.js';

interface ProductLocals {
  validated: { body?: CreateProductInput };
}

export class ProductController {
  /** Recebe as regras de negócio usadas pelo controller. */
  constructor(private readonly service: ProductService) {}

  /** Lista produtos e responde no formato público da API. */
  list = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json({ data: await this.service.list() }); }
    catch (error) { next(error); }
  };

  /** Cria um produto a partir do body validado e responde com status 201. */
  create = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name } = (res.locals as unknown as ProductLocals).validated.body!;
      res.status(201).json({ data: await this.service.create(name) });
    } catch (error) { next(error); }
  };
}
```

#### 7. Monte a rota, aplique Zod e documente OpenAPI

Crie `routes/products.route.ts`. O prefixo `routePath` e os caminhos relativos do router definem a URL Express. `openApiPaths` descreve a mesma operação para Swagger; escreva o caminho completo (`/products`). Inclua schemas de request/response para que Swagger mostre os formatos.

```ts
import { Router } from 'express';
import { ProductController } from '../controllers/product-controller.js';
import { ProductRepository } from '../repositories/product-repository.js';
import { ProductService } from '../services/product-service.js';
import { validateRequest } from '../middlewares/validate.js';
import { createProductSchema } from '../schemas/product-schemas.js';
import { z } from 'zod';

const router = Router();
const controller = new ProductController(new ProductService(new ProductRepository()));

/** Prefixo usado pelo carregador para montar as rotas deste recurso. */
export const routePath = '/products';

router.get('/', controller.list);
router.post('/', validateRequest({ body: createProductSchema }), controller.create);

const productResponseSchema = z.object({
  data: z.object({ id: z.number(), name: z.string(), created_at: z.string().datetime() }),
});

/** Operações deste router exibidas no Swagger quando OpenAPI está habilitado. */
export const openApiPaths = [
  {
    method: 'get', path: '/products', summary: 'Lista produtos',
    responses: { 200: { description: 'Lista de produtos', content: { 'application/json': { schema: z.object({ data: z.array(productResponseSchema.shape.data) }) } } } },
  },
  {
    method: 'post', path: '/products', summary: 'Cria um produto',
    request: { body: { required: true, content: { 'application/json': { schema: createProductSchema } } } },
    responses: { 201: { description: 'Produto criado', content: { 'application/json': { schema: productResponseSchema } } } },
  },
];

export default router;
```

#### 8. Inicie e confira cada camada

Rode `npm run dev`. Teste `GET http://localhost:3000/products` e envie `POST http://localhost:3000/products` com `Content-Type: application/json` e body `{ "name": "Teclado" }`. O GET responde com uma lista em `data`; o POST deve responder com status 201 e o produto criado em `data`. Confira `/docs.json` para verificar se `GET /products` e `POST /products` aparecem; depois abra `/docs`, atualize a página e use **Try it out**. Se receber 404, confira nome e pasta `routes/products.route.ts`. Se a rota responder mas não aparecer no Swagger, confira `openApiPaths`, o caminho completo e os schemas de request/response; reinicie o processo para recarregar o módulo da rota.

O fluxo fica `route → validateRequest/Zod → controller → service → repository → PostgreSQL`; a resposta volta pelo controller. Rotas não contêm SQL, services não conhecem HTTP, repositories não decidem status HTTP, e controllers não implementam regras de negócio.
<!-- CRUD_ONLY_END -->
<!-- OPENAPI_ONLY_END -->

O handler de erros usa `{ "error": { "message": "...", "code": "ERR_CODE" } }`. Erros inesperados retornam mensagem genérica em produção. Use `next(error)` nas rotas assíncronas para encaminhar falhas ao handler.

## Rotas disponíveis

| Método | Caminho | Descrição |
|---|---|---|
| `GET` | `/health` | Verifica a conexão com o PostgreSQL |
<!-- CRUD_ONLY_START -->
| `GET` | `/items` | Lista itens |
| `POST` | `/items` | Cria um item com `{ "name": "Exemplo" }` |
| `GET` | `/items/:id` | Consulta um item |
| `PUT` | `/items/:id` | Atualiza o nome de um item |
| `DELETE` | `/items/:id` | Remove um item |

As respostas de sucesso de itens usam `{ "data": ... }`. Erros de validação retornam status 400; IDs inexistentes retornam 404.
<!-- CRUD_ONLY_END -->
<!-- NO_CRUD_START -->
O projeto inicia sem endpoints de domínio. Adicione um arquivo `*.route.ts` conforme o padrão acima; suas rotas serão registradas automaticamente.
<!-- NO_CRUD_END -->

## Migrations

`npm run migrate` aplica, em ordem, os arquivos `.sql` de `databases/migrations/`. O processo encerra com erro se uma migration falhar. O Compose executa migrations automaticamente antes de iniciar a API; no desenvolvimento local, rode o comando depois de iniciar o PostgreSQL.

## Segurança

Helmet define cabeçalhos HTTP seguros; `X-Powered-By` fica desativado. O limite padrão é 100 requisições por IP a cada 15 minutos. CORS não permite origens até que `ALLOWED_ORIGINS` seja configurado. HPP protege contra parâmetros duplicados. O journal registra método, caminho, status, IP, user agent, duração, request ID e user ID, aplicando denylist recursiva a campos sensíveis do corpo.

O request ID é retornado no cabeçalho `X-Request-Id`. O valor do cabeçalho `X-User-Id` é usado como identificador para journal quando enviado pelo cliente; em aplicações com autenticação, substitua essa origem por uma identidade confiável estabelecida pelo middleware de autenticação.

## Configuração

| Variável | Descrição | Padrão |
|---|---|---|
| `NODE_ENV` | Ambiente (`development`, `production` ou `test`) | `development` |
| `PORT` | Porta HTTP | `3000` |
| `DB_HOST` | Host PostgreSQL (`db` no Compose) | obrigatório |
| `DB_PORT` | Porta PostgreSQL | `5432` |
| `DB_NAME` | Nome do banco | obrigatório |
| `DB_USER` | Usuário do banco | obrigatório |
| `DB_PASSWORD` | Senha do banco | obrigatório |
| `ALLOWED_ORIGINS` | Origens CORS separadas por vírgula | vazio (bloqueado) |
