# {{PROJECT_NAME}}

API Express com TypeScript sem integração com banco de dados. O template inclui Helmet, CORS restritivo, rate limit e HPP.

## Passo a passo após instalar

```sh
cp .env.example .env
npm install
npm run dev
```

Com o servidor em execução, abra [http://localhost:3000/docs](http://localhost:3000/docs) no navegador. Expanda uma operação e use **Try it out** e **Execute** para enviar requisições e ver as respostas. Esta variante inclui somente `/` e `/health`; ao criar endpoints, adicione as rotas e atualize `openapi.ts`. A especificação OpenAPI também pode ser consultada em `/docs.json`.

Para compilar e executar a versão de produção, use `npm run build` e `npm start`. Também é possível executar a API em container com `docker compose up --build`.

## Testar a API no navegador

Com a API em execução, abra [http://localhost:3000/docs](http://localhost:3000/docs). A página Swagger UI permite consultar e executar as rotas documentadas pelo botão **Try it out**. A especificação OpenAPI em JSON está em `/docs.json`. A variante sem banco documenta `/` e `/health`; ao adicionar rotas, atualize `openapi.ts` e os schemas correspondentes.

## Estrutura

```text
.
├── app.ts                    # Configuração do Express e rotas básicas
├── openapi.ts                # Especificação OpenAPI da API
├── server.ts                 # Inicialização HTTP e encerramento gracioso
├── config/env.ts             # Validação das variáveis de ambiente
├── middlewares/
│   ├── error-handler.ts      # Contrato padronizado de erro
│   └── validate.ts           # Utilitário de validação Zod para novas rotas
├── routes/                   # Adicione aqui os routers da API
├── types/express.d.ts        # Extensões dos tipos Express
├── Dockerfile
└── compose.yml
```

Não são gerados módulos de banco, migrations, journal de banco ou CRUD de exemplo. O endpoint `GET /health` retorna `{ "status": "ok", "database": "not_configured" }`. A estrutura pode ser ampliada com controllers, services, repositories e models quando o domínio da aplicação for definido.

## Configuração

`PORT` define a porta do servidor. `ALLOWED_ORIGINS` recebe uma lista separada por vírgulas; vazia, bloqueia o acesso CORS. O limite padrão é 100 requisições por IP a cada 15 minutos.
