# create-api-kit

English | [Português (Brasil)](README.pt-BR.md)

[Open the documentation site](https://gutovargas.github.io/create-api-kit/)

Generate secure REST APIs with Express and TypeScript. Choose PostgreSQL for persistence and migrations, and optionally include OpenAPI/Swagger UI at `/docs` with Zod schemas. Disabled features are omitted from the generated project, including their dependencies.

```sh
npx create-api-kit
# Or choose features explicitly:
npx create-api-kit my-api --database --openapi --crud
npx create-api-kit my-minimal-api --no-database --no-openapi
cd my-api
cp .env.example .env
docker compose up --build
```

Requires Node.js 20 or newer. Set `DB_PASSWORD` in `.env` when PostgreSQL is enabled. CORS denies browser origins by default; set `ALLOWED_ORIGINS` to a comma-separated list of trusted origins to allow them.

## Feature choices

| PostgreSQL | OpenAPI, Swagger UI and Zod | Generated project |
|---|---|---|
| Yes | Yes | Optional `/items` CRUD, persisted journal, migrations and `/docs` |
| Yes | No | Optional `/items` CRUD, persisted journal and migrations; no OpenAPI/Zod dependencies |
| No | Yes | No database; `/docs` and Zod available for new routes |
| No | No | Minimal API without database, Swagger or Zod |

When PostgreSQL is selected, the CLI also asks whether to include the sample `/items` CRUD. It is included by default to preserve the existing generator behavior; choose no to start with PostgreSQL, migrations and the request journal without a sample domain resource. CRUD is not offered without PostgreSQL. Use `--crud` or `--no-crud` in scripts; `--crud` requires `--database` if database selection is also explicit. OpenAPI/Zod are disabled by default.

## Generated architecture

With PostgreSQL, projects include SQL migrations, a request journal, secure headers, restrictive CORS, rate limiting and HPP protection. If selected, the `/items` CRUD demonstrates the `routes → middleware → controller → service → repository → PostgreSQL` flow. Services own business rules and transactions; repositories isolate SQL; models represent domain entities.

OpenAPI-enabled projects expose Swagger UI at `http://localhost:3000/docs` and the specification at `/docs.json`. Projects generated without OpenAPI omit Swagger and Zod dependencies; when CRUD is enabled they use manual parsers for its inputs. Projects without PostgreSQL omit database modules and expose `GET /health` with `database: not_configured`.

Routes are discovered from `routes/*.route.ts` during development and `routes/*.route.js` after compilation. Each module exports `routePath` and a router as its default export, so adding a router does not require editing `app.ts`. When OpenAPI is enabled, document new operations in `openapi.ts` as well.

## Development

For PostgreSQL projects, copy `.env.example` to `.env`, set `DB_PASSWORD`, then run:

```sh
docker compose up --build
```

Compose waits for PostgreSQL health, runs migrations and starts the API. For local development, start a PostgreSQL instance, set `DB_HOST=localhost`, then run `npm install`, `npm run migrate` and `npm run dev`. For projects without a database, run `npm install` and `npm run dev` (or `docker compose up --build`).

The generated README describes its folder structure, configuration, routes and development workflow. The [Portuguese README](README.pt-BR.md) also documents the generator repository and its template variants.

## CLI development

```sh
npm install
npm run check
node bin/create-api-kit.js sample-api --no-database --no-openapi
```

Inspect the publish contents with `npm pack --dry-run`. The package includes the CLI and all template variants.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Report bugs or request features in [GitHub Issues](https://github.com/GutoVargas/create-api-kit/issues).

## License

No license has been declared in this repository yet. Until the project owner chooses and adds one, do not assume that the source is licensed for reuse or redistribution.
