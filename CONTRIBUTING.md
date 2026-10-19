# Contributing

Thanks for helping improve `create-api-kit`. Issues and pull requests are welcome.

## Before opening a pull request

1. Open an issue for larger changes so the approach can be discussed first.
2. Keep the generated variants consistent: PostgreSQL with/without OpenAPI and no database with/without OpenAPI.
3. Update the relevant generated README and the root documentation when behavior, commands, dependencies or folder structure change.
4. Add or update JSDoc for functions and methods in the templates, following the existing convention.
5. Run the checks below and describe what you verified in the pull request.

```sh
npm install
npm run check
npm pack --dry-run
```

When changing generation behavior, manually generate each affected combination and inspect its files and dependencies. Do not commit generated test projects, `.env` files, `node_modules` or build output.

## Pull request description

Include the problem being solved, a summary of the change, affected template combinations, and commands or manual checks performed. Link related issues when applicable.

## Reporting vulnerabilities

Please do not publish details of an unpatched security vulnerability in a public issue. Contact the repository owner privately through the contact details listed on the GitHub profile and include steps to reproduce the issue.
