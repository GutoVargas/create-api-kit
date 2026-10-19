import { readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import type { Express, RequestHandler } from 'express';

interface ApiRouteModule {
  default: RequestHandler;
  routePath: string;
}

/** Importa e registra todos os módulos `*.route.ts` da pasta routes. */
export async function loadApiRoutes(app: Express): Promise<void> {
  const routesDirectory = dirname(fileURLToPath(import.meta.url));
  const entries = await readdir(routesDirectory, { withFileTypes: true });
  const routeFiles: string[] = [];
  for (const entry of entries) {
    if (entry.isFile() && /\.route\.(ts|js)$/.test(entry.name)) routeFiles.push(entry.name);
  }
  routeFiles.sort();

  for (const routeFile of routeFiles) {
    const moduleUrl = pathToFileURL(join(routesDirectory, routeFile)).href;
    const routeModule = await import(moduleUrl) as Partial<ApiRouteModule>;
    if (typeof routeModule.routePath !== 'string' || typeof routeModule.default !== 'function') {
      throw new Error(`A rota ${routeFile} precisa exportar routePath e um router default.`);
    }
    app.use(routeModule.routePath, routeModule.default);
  }
}
