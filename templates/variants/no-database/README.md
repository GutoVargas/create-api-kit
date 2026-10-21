# {{PROJECT_NAME}}

API Express com TypeScript sem integração com banco de dados. O template inclui Helmet, CORS restritivo, rate limit e HPP.

## Passo a passo após instalar

```sh
cp .env.example .env
npm install
npm run dev
```

<!-- OPENAPI_ONLY_START -->
Com o servidor em execução, abra [http://localhost:3000/docs](http://localhost:3000/docs) no navegador. Expanda uma operação e use **Try it out** e **Execute** para enviar requisições e ver as respostas. Esta variante começa com `/` e `/health`; adicione endpoints em arquivos `*.route.ts`, exportando `routePath`, o router default e `openApiPaths`. O carregador agrega as operações ao documento automaticamente. A especificação OpenAPI também pode ser consultada em `/docs.json`.
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

### Adicionar um recurso sem PostgreSQL

Sem banco, não há migrations nem repository PostgreSQL. Você ainda pode separar o código em camadas; crie os diretórios conforme precisar. Abra a raiz do projeto e siga a ordem abaixo. O [tutorial visual com exemplos completos](https://gutovargas.github.io/create-api-kit/#tutorial-products) mostra o mesmo fluxo com seletor para alternar entre projetos com e sem PostgreSQL.

```text
Cliente → route → validação → controller → service → origem dos dados
   ↑                                                   ↓
   └──────────── status HTTP e JSON de resposta ───────┘
```

1. **Defina os dados e seus tipos.** Crie `models/product.ts` e descreva o formato que a API devolve. O tipo da resposta não é o mesmo que o body de criação: um produto novo ainda não possui ID nem data criada pelo sistema.
2. **Escolha a origem dos dados.** Para prototipar, o service pode manter uma lista em memória. Ela é apagada quando o processo reinicia. Para dados duráveis, integre uma API ou armazenamento e isole o acesso em `repositories/`.
3. **Valide a entrada.** Com OpenAPI habilitado, crie `schemas/product-schemas.ts`, defina um schema Zod e derive o tipo de entrada com `z.infer`. Com `--no-openapi`, Zod não é instalado: use um parser manual no `validateRequest` existente.
4. **Escreva o service.** Crie `services/product-service.ts`. Ele recebe dados já validados, aplica regras do domínio e chama a origem de dados. Não importe `Request` ou `Response` do Express nessa camada.
5. **Escreva o controller.** Crie `controllers/product-controller.ts`. Ele lê valores validados de `res.locals.validated`, chama o service e define status e JSON. Passe falhas assíncronas para `next(error)`.
6. **Ligue as camadas na rota.** Crie `routes/products.route.ts`, instancie controller e service, exporte `routePath = '/products'`, registre métodos no router e exporte o router como `default`. Com OpenAPI, exporte também `openApiPaths` usando o caminho completo `/products`.
7. **Reinicie e confira.** Rode `npm run dev` novamente para o carregador encontrar o novo arquivo. Teste a URL com `curl`; com OpenAPI habilitado, confira `/docs.json` e abra `/docs`.

O template sem PostgreSQL não cria automaticamente essas camadas, pois não presume de onde vêm os dados. Crie somente os arquivos que o recurso precisa. Sem armazenamento persistente, uma resposta após reiniciar o servidor não representa os dados anteriores.

## Configuração

`PORT` define a porta do servidor. `ALLOWED_ORIGINS` recebe uma lista separada por vírgulas; vazia, bloqueia o acesso CORS. O limite padrão é 100 requisições por IP a cada 15 minutos.
