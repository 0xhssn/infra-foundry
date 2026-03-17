# CLAUDE.md

Project context and conventions for Claude Code.

## Project Overview

**infra-foundry** is a TypeScript + Pulumi library of reusable cloud infrastructure components for AWS and Cloudflare. It is published to npm and versioned via `semantic-release`.

## Package Manager

Always use **Yarn**. Never use npm or pnpm for installs or script execution.

## Common Commands

```bash
yarn build            # tsc → dist/
yarn lint             # ESLint over src/
yarn lint:fix         # ESLint --fix
yarn format           # Prettier --write
yarn format:check     # Prettier --check
yarn clean            # rm -rf dist
```

## Commit Conventions (enforced by commitlint + Husky)

Format: `<type>(<scope>): <subject>`

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

**Scopes (required)**: `amplify`, `cloudflare`, `ecr`, `ecs`, `image`, `route53`, `s3`, `secret`, `ses`, `vpc`, `utils`, `deps`, `ci`, `release`

Rules:

- Scope is **mandatory** on every commit
- Subject must be **lower-case**, no trailing period
- Header max 100 chars
- Breaking changes: append `!` — e.g. `feat(s3)!: rename bucket arg`

## Source Structure

```
src/
├── <component>/
│   ├── component.ts   # ComponentResource subclass
│   ├── types.ts       # TypeScript interfaces / config types
│   ├── iam.ts         # IAM roles & policies (optional)
│   └── index.ts       # Re-exports
└── utils/             # Shared helpers (context, tags, env, domain)
```

All components are re-exported from `src/index.ts`.

## TypeScript

- Strict mode enabled (`"strict": true`)
- Target: `ES2019`, module: `CommonJS`
- No semicolons, single quotes (enforced by ESLint + Prettier)
- Import order enforced: builtin → external → internal (alphabetical)

## Release Process

`semantic-release` runs on CI for `main` (stable), `beta`, and `alpha` branches. Version bumps are derived from commit types:

- `feat` → minor
- `fix` / `perf` → patch
- `!` breaking → major
- `docs` / `chore` / `ci` → no release

Never manually edit `package.json` version or `CHANGELOG.md`.

## Adding a New Component

1. `mkdir src/<service>`
2. Create `component.ts`, `types.ts`, `index.ts` (and `iam.ts` if IAM is needed)
3. Add export to `src/index.ts`: `export * as <service> from './<service>'`
4. Add the scope to `commitlint.config.cjs` `scope-enum` list
5. Build and lint before committing

## Do Not

- Commit credentials, env-specific values, or personal Pulumi stack configs
- Use `console.log` without suppressing the ESLint warning (`// eslint-disable-next-line no-console`)
- Amend published commits or force-push to `main`
