# Changelog

Notable changes to `create-api-kit` are recorded here, organized by package version.

## Unreleased

## [1.0.1] - 2026-10-21

**Author:** GutoVargas

### Generator and project templates

- Added the `npx create-api-kit` CLI to create Express and TypeScript API projects from ready-to-run templates.
- Added interactive and flag-based choices for PostgreSQL, the sample CRUD, and OpenAPI/Zod, including PostgreSQL and no-database project variants.
- Added a generated MVC CRUD example with typed models, controllers, services, repositories, request validation, and centralized error handling.
- Added PostgreSQL connection and environment configuration, SQL migrations, a request journal, Dockerfile, and Docker Compose setup to the database template.
- Added baseline API protections and runtime configuration, including secure headers, CORS controls, rate limiting, HPP protection, and health checks.

### Routes and API documentation

- Added Swagger UI and an OpenAPI JSON endpoint to projects that opt in to OpenAPI/Zod; projects can also be generated without those dependencies.
- Added automatic discovery of `*.route.ts` and compiled `*.route.js` route modules. Export `routePath` and the router as the default export; export `openApiPaths` to include endpoint definitions in the generated OpenAPI document.
- Added interactive HTML documentation and step-by-step guides for both PostgreSQL and no-database projects, covering file creation, TypeScript types, Zod schemas, repositories, services, controllers, routes, and OpenAPI.
- Expanded the English and Brazilian Portuguese READMEs with CLI options, feature combinations, setup instructions, generated project workflows, and contribution guidance; added GitHub Pages documentation.

### Package and repository

- Added npm package metadata, the `create-api-kit` executable, package file selection, and publishing exclusions.
- Added the MIT license and package discovery metadata, including keywords, repository, homepage, and issue links.
- Removed generated API example files from the repository root; the API examples are maintained in the generator templates.

