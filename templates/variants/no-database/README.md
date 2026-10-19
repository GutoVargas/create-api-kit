# {{PROJECT_NAME}}

API Express com TypeScript sem integração com banco de dados. O template inclui Helmet, CORS restritivo, rate limit e HPP.

## Passo a passo após instalar

```sh
cp .env.example .env
npm install
npm run dev
```

<!-- OPENAPI_ONLY_START -->
Com o servidor em execução, abra [http://localhost:3000/docs](http://localhost:3000/docs) no navegador. Expanda uma operação e use **Try it out** e **Execute** para enviar requisições e ver as respostas. Esta variante começa com `/` e `/health`; adicione seus endpoints criando arquivos `*.route.ts` e registre as operações em `openapi.ts`. A especificação OpenAPI também pode ser consultada em `/docs.json`.
<!-- OPENAPI_ONLY_END -->
<!-- NO_OPENAPI_START -->
Esta API inicia sem OpenAPI, Swagger UI ou Zod e não instala dependências de documentação ou Zod. Para adicionar endpoints, crie arquivos `*.route.ts` e valide entradas com parsers manuais.
<!-- NO_OPENAPI_END -->

Para compilar e executar a versão de produção, use `npm run build` e `npm start`. Também é possível executar a API em container com `docker compose up --build`.

## Estrutura

```text
.
├── app.ts                    # Configuração do Express e rotas básicas
<!-- OPENAPI_ONLY_START -->
├── openapi.ts                # Especificação OpenAPI da API
<!-- OPENAPI_ONLY_END -->
├── server.ts                 # Inicialização HTTP e encerramento gracioso
├── config/env.ts             # Validação das variáveis de ambiente
├── middlewares/
│   ├── error-handler.ts      # Contrato padronizado de erro
│   └── validate.ts           # Utilitário de validação para novas rotas
├── routes/
│   └── loader.ts             # Registra automaticamente arquivos *.route.ts
├── types/express.d.ts        # Extensões dos tipos Express
├── Dockerfile
└── compose.yml
```

Não são gerados módulos de banco, migrations, journal de banco ou CRUD de exemplo. O endpoint `GET /health` retorna `{ "status": "ok", "database": "not_configured" }`. Crie um router em `routes/<recurso>.route.ts`, exporte `routePath` e o router como `default`; o carregador o registra automaticamente, sem editar `app.ts`. A estrutura pode ser ampliada com controllers, services, repositories e models quando o domínio da aplicação for definido.

## Configuração

`PORT` define a porta do servidor. `ALLOWED_ORIGINS` recebe uma lista separada por vírgulas; vazia, bloqueia o acesso CORS. O limite padrão é 100 requisições por IP a cada 15 minutos.
