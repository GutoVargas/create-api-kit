# Registro de alterações

Este arquivo resume a integração da documentação interativa OpenAPI/Swagger nos templates e a correção aplicada após o erro observado ao iniciar `api_teste`.

## Swagger UI e OpenAPI

- Adicionadas as dependências `@asteasolutions/zod-to-openapi` e `swagger-ui-express` aos templates com e sem PostgreSQL, com os respectivos tipos TypeScript e lockfiles atualizados.
- Adicionada a rota `/docs`, que serve a interface Swagger UI, e `/docs.json`, que entrega a especificação OpenAPI.
- No template PostgreSQL, as rotas `/health`, `/`, e CRUD `/items` estão descritas. Os schemas Zod existentes são reutilizados para parâmetros e corpo das requisições; os schemas de resposta também estão descritos.
- No template sem PostgreSQL, `/health` e `/` estão descritos, mantendo a documentação disponível sem gerar dependências ou módulos de banco.
- O CLI substitui `{{PROJECT_NAME}}` pelo nome informado durante a geração também no título da documentação.
- Os READMEs dos templates agora explicam como iniciar a API, abrir `/docs`, executar chamadas pelo botão **Try it out** e atualizar a especificação ao adicionar rotas. O README principal anuncia esse recurso.

## Correção do erro em `api_teste`

Ao montar a especificação com parâmetros Zod, `zod-to-openapi` chama `.openapi()` nos schemas. O método não existia porque a extensão da instância Zod não havia sido inicializada. Foi adicionado `extendZodWithOpenApi(z)` nos dois arquivos OpenAPI do template e no `api_teste/openapi.ts`, que é o projeto citado no erro.

## Arquivos alterados nesta integração

- `templates/default/app.ts` e `templates/default/openapi.ts`
- `templates/variants/no-database/app.ts` e `templates/variants/no-database/openapi.ts`
- `templates/default/package.json` e `templates/default/package-lock.json`
- `templates/variants/no-database/package-lock.json`
- `bin/create-api-kit.js`
- `templates/default/README.md` e `templates/variants/no-database/README.md`
- `README.md`
- `api_teste/openapi.ts`

## Como acessar

Após iniciar qualquer projeto gerado, abra `http://localhost:3000/docs`. A especificação em JSON está em `http://localhost:3000/docs.json`.
