#!/usr/bin/env node
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';

/** Mostra uma falha de uso e marca o processo para terminar com código 1. */
function fail(message) {
  console.error(`create-api-kit: ${message}`);
  process.exitCode = 1;
}

/** Verifica se o nome pode ser usado por npm e pelo sistema de arquivos. */
function isValidProjectName(name) {
  return /^[a-z0-9][a-z0-9._-]*$/.test(name)
    && !name.endsWith('.')
    && name.length <= 214
    && !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(name);
}

/** Retira arquivos e diretórios que só são necessários na variante PostgreSQL. */
async function removeDatabaseFiles(target) {
  const databasePaths = [
    'databases',
    'controllers',
    'services',
    'repositories',
    'models',
    'schemas',
    'errors',
    'routes/items.route.ts',
    'routes/journal.ts',
    'middlewares/journal.ts',
  ];
  for (const path of databasePaths) {
    await rm(join(target, path), { recursive: true, force: true });
  }
}

/** Remove o CRUD de exemplo e preserva o banco, o journal e a estrutura de rotas. */
async function removeCrudFiles(target) {
  const crudPaths = [
    'controllers',
    'services',
    'repositories',
    'models',
    'schemas',
    'errors',
    'routes/items.route.ts',
    'databases/migrations/002_create_items.sql',
  ];
  for (const path of crudPaths) {
    await rm(join(target, path), { recursive: true, force: true });
  }
}

/** Remove as dependências e o script de migration do pacote sem PostgreSQL. */
function removeDatabaseDependencies(packageJson, lock) {
  delete packageJson.dependencies.pg;
  delete packageJson.devDependencies['@types/pg'];
  delete packageJson.scripts.migrate;

  const rootLock = lock.packages[''];
  delete rootLock.dependencies.pg;
  delete rootLock.devDependencies['@types/pg'];
}

/** Retira Zod e as bibliotecas OpenAPI quando o projeto é gerado sem essa feature. */
function removeOpenApiDependencies(packageJson, lock) {
  delete packageJson.dependencies['@asteasolutions/zod-to-openapi'];
  delete packageJson.dependencies['swagger-ui-express'];
  delete packageJson.dependencies.zod;
  delete packageJson.devDependencies['@types/swagger-ui-express'];

  const rootLock = lock.packages[''];
  delete rootLock.dependencies['@asteasolutions/zod-to-openapi'];
  delete rootLock.dependencies['swagger-ui-express'];
  delete rootLock.dependencies.zod;
  delete rootLock.devDependencies['@types/swagger-ui-express'];
}

/** Injeta ou remove as rotas da documentação interativa no app gerado. */
async function configureOpenApi(target, useOpenApi, projectName) {
  const appPath = join(target, 'app.ts');
  const appSource = await readFile(appPath, 'utf8');
  const openApiBlocks = useOpenApi
    ? {
        '{{OPENAPI_IMPORTS}}': "import swaggerUi from 'swagger-ui-express';\nimport { createOpenApiDocument } from './openapi.js';",
        '{{OPENAPI_ROUTES}}': "  app.get('/docs.json', openApiJson);\n  app.use('/docs', swaggerUi.serve, swaggerUi.setup(createOpenApiDocument()));",
        '{{OPENAPI_HANDLER}}': "/** Retorna a especificação OpenAPI em JSON para ferramentas e clientes. */\nconst openApiJson: RequestHandler = (_req, res) => { res.json(createOpenApiDocument()); };",
      }
    : { '{{OPENAPI_IMPORTS}}': '', '{{OPENAPI_ROUTES}}': '', '{{OPENAPI_HANDLER}}': '' };
  let configuredApp = appSource;
  for (const [placeholder, replacement] of Object.entries(openApiBlocks)) {
    configuredApp = configuredApp.replace(placeholder, replacement);
  }
  await writeFile(appPath, configuredApp);
  const openApiPath = join(target, 'openapi.ts');
  if (!useOpenApi) {
    await rm(openApiPath, { force: true });
  } else {
    const openApiSource = await readFile(openApiPath, 'utf8');
    await writeFile(openApiPath, openApiSource.replaceAll('{{PROJECT_NAME}}', projectName));
  }
}

/** Mantém a especificação OpenAPI coerente quando o projeto omite o CRUD de exemplo. */
async function configureCrud(target, useCrud) {
  if (useCrud) return;

  await removeCrudFiles(target);
  const openApiPath = join(target, 'openapi.ts');
  if (existsSync(openApiPath)) {
    const source = await readFile(openApiPath, 'utf8');
    const withoutCrud = source
      .replace(/\/\* CRUD_ONLY_START \*\/[\s\S]*?\/\* CRUD_ONLY_END \*\//g, '')
      .replace(/\/\* CRUD_ONLY_START \*\//g, '')
      .replace(/\/\* CRUD_ONLY_END \*\//g, '');
    await writeFile(openApiPath, withoutCrud);
  }
}

/** Seleciona no README os blocos de documentação conforme as features geradas. */
function configureReadme(readme, useOpenApi, useCrud) {
  return readme
    .replace(/<!-- OPENAPI_ONLY_START -->([\s\S]*?)<!-- OPENAPI_ONLY_END -->/g, useOpenApi ? '$1' : '')
    .replace(/<!-- NO_OPENAPI_START -->([\s\S]*?)<!-- NO_OPENAPI_END -->/g, useOpenApi ? '' : '$1')
    .replace(/<!-- CRUD_ONLY_START -->([\s\S]*?)<!-- CRUD_ONLY_END -->/g, useCrud ? '$1' : '')
    .replace(/<!-- NO_CRUD_START -->([\s\S]*?)<!-- NO_CRUD_END -->/g, useCrud ? '' : '$1');
}

/** Copia o template escolhido, atualiza o nome e configura os arquivos do projeto. */
async function createProject(projectName, useDatabase, useOpenApi, useCrud) {
  const target = resolve(process.cwd(), projectName);
  if (isAbsolute(projectName) || existsSync(target)) {
    throw new Error(`O destino já existe ou não é válido: ${basename(target)}`);
  }

  const template = fileURLToPath(new URL('../templates/default/', import.meta.url));
  await mkdir(dirname(target), { recursive: true });
  await cp(template, target, { recursive: true });

  if (!useDatabase) {
    const variant = fileURLToPath(new URL('../templates/variants/no-database/', import.meta.url));
    await cp(variant, target, { recursive: true, force: true });
    await removeDatabaseFiles(target);
  }

  if (!useOpenApi) {
    const variantName = useDatabase ? 'postgres' : 'no-database';
    const variant = fileURLToPath(new URL(`../templates/variants/no-openapi/${variantName}/`, import.meta.url));
    await cp(variant, target, { recursive: true, force: true });
  }
  await configureOpenApi(target, useOpenApi, projectName);
  if (useDatabase) await configureCrud(target, useCrud);

  const packagePath = join(target, 'package.json');
  const packageJson = JSON.parse(await readFile(packagePath, 'utf8'));
  packageJson.name = projectName;

  const lockPath = join(target, 'package-lock.json');
  const lock = JSON.parse(await readFile(lockPath, 'utf8'));
  lock.name = projectName;
  lock.packages[''].name = projectName;
  if (!useDatabase) removeDatabaseDependencies(packageJson, lock);
  if (!useOpenApi) removeOpenApiDependencies(packageJson, lock);

  await writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
  await writeFile(lockPath, `${JSON.stringify(lock, null, 2)}\n`);

  const readmePath = join(target, 'README.md');
  const readme = await readFile(readmePath, 'utf8');
  await writeFile(readmePath, configureReadme(readme, useOpenApi, useCrud).replaceAll('{{PROJECT_NAME}}', projectName));

  console.log(`Projeto ${projectName} criado em ${target}`);
  console.log(`\nPróximos passos:\n  cd ${projectName}\n  cp .env.example .env\n  npm install`);
  console.log(useDatabase
    ? 'Configure DB_PASSWORD no .env e execute: docker compose up --build'
    : 'Execute: docker compose up --build (nenhum banco será iniciado)');
  console.log(useOpenApi
    ? 'Documentação interativa disponível em /docs (OpenAPI + Zod incluídos)'
    : 'OpenAPI, Swagger UI e Zod não foram incluídos neste projeto.');
  if (useDatabase) {
    console.log(useCrud
      ? 'CRUD de exemplo incluído em /items; você pode removê-lo e adicionar seus próprios recursos.'
      : 'CRUD de exemplo não incluído; o PostgreSQL continua disponível para seus recursos.');
  }
}

/** Lê argumentos e prompts, valida as escolhas e gera a API correspondente. */
async function main() {
  const args = process.argv.slice(2);
  let projectNameArg;
  let unknownFlag;
  for (const argument of args) {
    if (!argument.startsWith('--') && projectNameArg === undefined) projectNameArg = argument;
    if (argument.startsWith('--') && !['--database', '--no-database', '--no-db', '--openapi', '--no-openapi', '--crud', '--no-crud'].includes(argument)) {
      unknownFlag = argument;
    }
  }
  const forceDatabase = args.includes('--database')
    ? true
    : args.includes('--no-database') || args.includes('--no-db') ? false : undefined;
  const forceOpenApi = args.includes('--openapi')
    ? true
    : args.includes('--no-openapi') ? false : undefined;
  const forceCrud = args.includes('--crud')
    ? true
    : args.includes('--no-crud') ? false : undefined;
  if (unknownFlag) { fail(`Opção desconhecida: ${unknownFlag}`); return; }

  const prompt = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const projectName = (projectNameArg ?? (process.stdin.isTTY
      ? await prompt.question('Nome da pasta/projeto: ')
      : '')).trim();
    if (!projectName) {
      fail('Informe o nome do projeto: npx create-api-kit <nome>');
      return;
    }
    if (!isValidProjectName(projectName)) {
      fail('Nome inválido. Use até 214 caracteres: letras minúsculas, números, ponto, hífen ou sublinhado; comece por letra ou número.');
      return;
    }

    const useDatabase = forceDatabase ?? (process.stdin.isTTY
      ? !/^n(o)?$/i.test((await prompt.question('Deseja integrar PostgreSQL para dados e journal? (S/n): ')).trim())
      : true);
    if (forceCrud === true && !useDatabase) {
      fail('A opção --crud exige PostgreSQL. Remova --crud ou habilite --database.');
      return;
    }
    const useCrud = useDatabase
      ? forceCrud ?? (process.stdin.isTTY
        ? !/^n(o)?$/i.test((await prompt.question('Deseja incluir um CRUD de exemplo para começar? (S/n): ')).trim())
        : true)
      : false;
    const useOpenApi = forceOpenApi ?? (process.stdin.isTTY
      ? /^s(im)?$/i.test((await prompt.question('Deseja incluir OpenAPI, Swagger em /docs e validações com Zod? (s/N): ')).trim())
      : false);
    await createProject(projectName, useDatabase, useOpenApi, useCrud);
  } catch (error) {
    fail(error instanceof Error ? error.message : 'Falha ao criar o projeto.');
  } finally {
    prompt.close();
  }
}

await main();
