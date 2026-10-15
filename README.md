# create-api-kit

CLI para gerar APIs com Express, TypeScript e PostgreSQL. Os projetos gerados incluem validação Zod, documentação interativa Swagger UI em `/docs`, migrations, journal de requisições e configurações seguras para desenvolvimento e Docker.

## Gerar uma API

```sh
npx create-api-kit
# Nome da pasta/projeto: minha-api
# Deseja integrar PostgreSQL para dados e journal? (S/n): s
cd minha-api
cp .env.example .env
```

Com argumentos, o nome da pasta pode ser informado diretamente. O PostgreSQL é habilitado por padrão; use `--no-database` para gerar uma API sem módulos, diretórios ou dependências de banco. `--database` seleciona explicitamente a opção com PostgreSQL, inclusive em automações.

```sh
npx create-api-kit minha-api --no-database
```

Com PostgreSQL, configure `DB_PASSWORD` no `.env`. Sem PostgreSQL, esses campos e a configuração de migrations não são gerados. Em ambas as opções, CORS fica bloqueado por padrão; preencha `ALLOWED_ORIGINS` com as origens permitidas, separadas por vírgula.

## Desenvolver no projeto gerado

O README criado no projeto descreve sua estrutura e comandos. Na opção PostgreSQL, o Compose inicia o banco, executa migrations e sobe a API:

```sh
docker compose up --build
```

Na opção sem banco, o Compose inicia apenas a API; `GET /health` retorna `database: not_configured` e não há rota CRUD `/items`. Na opção PostgreSQL, `/items` demonstra as operações CRUD e o journal é persistido no banco.

## Estrutura deste repositório

```text
.
├── bin/create-api-kit.js   # Executável do CLI
└── templates/default/      # Arquivos copiados para cada novo projeto
    ├── routes/             # Rotas Express e composição das camadas
    ├── controllers/        # Adaptadores HTTP
    ├── services/           # Regras de negócio e transações
    ├── repositories/       # Acesso SQL ao PostgreSQL
    ├── models/             # Entidades com getters, setters e invariantes
    ├── schemas/            # Validação Zod
    └── databases/          # Pool PostgreSQL e migrations
```

O CRUD de exemplo segue `route → controller → service → repository → model/banco`. Faça alterações no template em `templates/default/`; essa é a fonte usada pelo CLI em produção. Atualize o README do template quando mudar comandos, estrutura ou padrões de implementação. `package.json` configura o comando `create-api-kit` e inclui `bin/` e `templates/default/` no pacote npm.

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
