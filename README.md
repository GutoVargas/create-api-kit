# create-api-kit

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

Com argumentos, o nome da pasta pode ser informado diretamente. O PostgreSQL é habilitado por padrão; use `--no-database` para gerar uma API sem módulos, diretórios ou dependências de banco. `--database` seleciona explicitamente a opção com PostgreSQL, inclusive em automações.

OpenAPI e Zod são opcionais e desabilitados por padrão. Use `--openapi` para incluí-los ou `--no-openapi` para omiti-los. No modo interativo, o CLI pergunta essa opção depois da escolha do banco.

```sh
npx create-api-kit minha-api --no-database
npx create-api-kit minha-api-com-docs --openapi
npx create-api-kit minha-api-minima --no-database --no-openapi
```

Com PostgreSQL, configure `DB_PASSWORD` no `.env`. Sem PostgreSQL, esses campos e a configuração de migrations não são gerados. Em ambas as opções, CORS fica bloqueado por padrão; preencha `ALLOWED_ORIGINS` com as origens permitidas, separadas por vírgula.

## Desenvolver no projeto gerado

O README criado no projeto descreve sua estrutura e comandos. Na opção PostgreSQL, o Compose inicia o banco, executa migrations e sobe a API:

```sh
docker compose up --build
```

Na opção sem banco, o Compose inicia apenas a API; `GET /health` retorna `database: not_configured` e não há rota CRUD `/items`. Na opção PostgreSQL, `/items` demonstra as operações CRUD e o journal é persistido no banco. A rota `/docs` só é criada quando OpenAPI/Zod forem habilitados.

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
