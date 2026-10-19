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
5. Para desenvolver, adicione schemas em `schemas/`, implemente as camadas da aplicação e registre a operação em `openapi.ts`. Reinicie o servidor de desenvolvimento e atualize `/docs`.
<!-- OPENAPI_ONLY_END -->
<!-- NO_OPENAPI_START -->
3. A API inicia sem OpenAPI, Swagger UI ou Zod. A validação do CRUD de exemplo usa parsers manuais em `schemas/` e continua retornando erros 400 para entradas inválidas.
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
├── routes/
│   ├── items.ts                 # Rotas e composição das dependências
│   └── journal.ts               # Ponto de extensão para rotas do journal
├── types/
│   └── express.d.ts             # Extensões dos tipos do Express
├── Dockerfile
├── compose.yml
├── .env.example
└── tsconfig.json
```

### Arquitetura e responsabilidades

O fluxo da requisição é `routes → middlewares → controller → service → repository → PostgreSQL`; a resposta percorre o caminho de volta. `app.ts` registra as rotas e os middlewares globais.

- **Routes:** declaram caminhos HTTP, aplicam schemas e encaminham para o controller. Não contêm regras de negócio nem SQL.
- **Controllers:** leem valores validados, chamam um serviço e definem status e formato HTTP. Encaminham erros com `next(error)`.
- **Services:** implementam regras de negócio e coordenam transações quando uma operação grava dados.
- **Repositories:** isolam as consultas SQL e convertem registros do banco em entidades.
- **Models:** representam entidades e protegem seus invariantes. `Item` mantém campos privados (`_id`, `_name`, `_createdAt`), expõe getters e setters e valida os valores atribuídos. `toJSON()` define o formato enviado pela API.
- **Schemas:** definem os formatos permitidos para body, params e query com Zod na opção OpenAPI ou parsers manuais na opção sem OpenAPI.
- **Errors:** `AppError` carrega status HTTP e código de erro sem misturar detalhes de transporte com SQL.

Toda função, método, getter, setter e callback nomeado deve ter um comentário JSDoc imediatamente acima descrevendo seu propósito. Documente também parâmetros, retorno e efeitos colaterais quando não forem evidentes pela assinatura.

### Adicionar um recurso

1. Crie a entidade em `models/` com propriedades privadas e getters/setters para validar invariantes.
2. Defina os schemas ou parsers de entrada em `schemas/` e crie um repository em `repositories/` para concentrar as consultas SQL.
3. Implemente as regras e transações no service. Use `getClient()` e garanta `COMMIT`, `ROLLBACK` e `release()`; o `ItemService` mostra esse padrão.
4. Crie um controller que consome o service sem conhecer SQL, e registre os endpoints e parsers/schemas em `routes/`.
5. Monte as dependências no arquivo de rota, como em `routes/items.ts`, e monte o router em `app.ts` antes dos handlers finais de 404 e erro.
6. Para mudanças no banco, adicione uma migration SQL numerada em `databases/migrations/`. Não altere migrations já aplicadas em ambientes compartilhados.

Evite colocar regras de negócio em routes/controllers, consultas SQL em services, ou lógica HTTP em models/repositories. Essa separação mantém cada camada fácil de revisar e substituir.

O handler de erros usa `{ "error": { "message": "...", "code": "ERR_CODE" } }`. Erros inesperados retornam mensagem genérica em produção. Use `next(error)` nas rotas assíncronas para encaminhar falhas ao handler.

## Rotas disponíveis

| Método | Caminho | Descrição |
|---|---|---|
| `GET` | `/health` | Verifica a conexão com o PostgreSQL |
| `GET` | `/items` | Lista itens |
| `POST` | `/items` | Cria um item com `{ "name": "Exemplo" }` |
| `GET` | `/items/:id` | Consulta um item |
| `PUT` | `/items/:id` | Atualiza o nome de um item |
| `DELETE` | `/items/:id` | Remove um item |

As respostas de sucesso de itens usam `{ "data": ... }`. Erros de validação retornam status 400; IDs inexistentes retornam 404.

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
