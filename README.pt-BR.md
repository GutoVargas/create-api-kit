# create-api-kit

[English](README.md) | Português (Brasil)

[Acessar documentação visual](https://gutovargas.github.io/create-api-kit/)

CLI para gerar APIs com Express e TypeScript. Durante a criação, escolha a integração PostgreSQL e, opcionalmente, OpenAPI/Swagger em `/docs` com validações Zod. Se OpenAPI/Zod forem desativados, essas dependências não serão instaladas e a API gerada usará parsers manuais para validar entradas.

## Gerar uma API

```sh
npx create-api-kit
# Nome da pasta/projeto: minha-api
# Deseja integrar PostgreSQL para dados e journal? (S/n): s
# Deseja incluir OpenAPI, Swagger em /docs e validações com Zod? (s/N): s
cd minha-api
cp .env.example .env
```

O `create-api-kit` é indicado para quem quer iniciar uma API REST em Express e TypeScript com uma base organizada, segurança configurada e escolha explícita das integrações.

Com argumentos, o nome da pasta pode ser informado diretamente. O PostgreSQL é habilitado por padrão; use `--no-database` para gerar uma API sem módulos, diretórios ou dependências de banco. `--database` seleciona explicitamente a opção com PostgreSQL, inclusive em automações.

OpenAPI e Zod são opcionais e desabilitados por padrão. Use `--openapi` para incluí-los ou `--no-openapi` para omiti-los. Quando PostgreSQL estiver habilitado, o CLI também pergunta se deve incluir o CRUD de exemplo `/items`; a resposta padrão é sim para preservar o comportamento atual. Responda não ou use `--no-crud` para iniciar com o banco, migrations e journal sem um recurso de exemplo. Sem PostgreSQL, essa pergunta é omitida. `--crud` força a inclusão e requer PostgreSQL.

```sh
npx create-api-kit minha-api --no-database
npx create-api-kit minha-api-com-docs --openapi
npx create-api-kit minha-api-minima --no-database --no-openapi
npx create-api-kit minha-api-sem-crud --database --no-crud
```

Com PostgreSQL, configure `DB_PASSWORD` no `.env`. Sem PostgreSQL, esses campos e a configuração de migrations não são gerados. Em ambas as opções, CORS fica bloqueado por padrão; preencha `ALLOWED_ORIGINS` com as origens permitidas, separadas por vírgula.

## Desenvolver no projeto gerado

### Combinações disponíveis

| PostgreSQL | OpenAPI, Swagger UI e Zod | Resultado |
|---|---|---|
| Sim | Sim | CRUD `/items` opcional, journal persistido, migrations e `/docs` |
| Sim | Não | CRUD `/items` opcional, journal persistido e migrations; sem dependências OpenAPI/Zod |
| Não | Sim | API sem banco, com `/docs` e Zod para novas rotas |
| Não | Não | API mínima sem banco, Swagger ou Zod |

Use `--no-database` e `--no-openapi` para gerar uma API sem essas integrações e sem suas dependências. `--openapi` habilita a documentação e schemas Zod. O modo interativo pergunta as opções.

As rotas são descobertas automaticamente em `routes/*.route.ts` durante o desenvolvimento e `routes/*.route.js` após a compilação. Cada módulo exporta `routePath` e um router como exportação padrão; não é necessário editar `app.ts` para registrar um router. Com OpenAPI habilitado, documente as operações novas também em `openapi.ts`.

O README criado no projeto descreve sua estrutura e comandos. Na opção PostgreSQL, o Compose inicia o banco, executa migrations e sobe a API:

```sh
docker compose up --build
```

Na opção sem banco, o Compose inicia apenas a API e `GET /health` retorna `database: not_configured`. Com PostgreSQL, o journal é persistido no banco; a rota CRUD `/items` é opcional e o CLI pergunta se deve incluí-la. A rota `/docs` só é criada quando OpenAPI/Zod forem habilitados.

## Estrutura deste repositório

```text
.
├── bin/create-api-kit.js   # Executável do CLI
└── templates/
    ├── default/            # Template com PostgreSQL e feature OpenAPI/Zod
    └── variants/
        ├── no-database/    # Sobreposições para projetos sem banco
        └── no-openapi/     # Parsers manuais e lockfiles sem Zod/Swagger
```

O CRUD de exemplo segue `route → controller → service → repository → model/banco`. O diretório `templates/default/` define o fluxo com PostgreSQL e OpenAPI; os arquivos em `templates/variants/` substituem apenas as partes necessárias para cada escolha. Atualize os READMEs quando mudar comandos, estrutura ou padrões de implementação. `package.json` configura o comando `create-api-kit` e inclui `bin/` e toda a pasta `templates/` no pacote npm.

O código do template usa JSDoc em todas as funções e métodos. Mantenha essa convenção ao adicionar ou alterar funcionalidades, explicando propósito, parâmetros, retorno e efeitos colaterais relevantes.

## Desenvolvimento do CLI

```sh
npm install
npm run check
```

Gere um projeto localmente para verificar o fluxo do CLI:

```sh
node bin/create-api-kit.js minha-api-local
cd minha-api-local
npm install
npm run build
```

Antes de publicar, confira os arquivos incluídos com `npm pack --dry-run`. O pacote requer autenticação npm e o nome `create-api-kit` disponível no registry.

## Contribuir e licença

Consulte [CONTRIBUTING.md](CONTRIBUTING.md) para orientações sobre issues, pull requests e verificações locais. Este projeto está sob a [licença MIT](LICENSE), que permite usar, copiar, modificar, mesclar, publicar, distribuir, sublicenciar e vender cópias do software, desde que o aviso de copyright e o texto da licença sejam mantidos.
