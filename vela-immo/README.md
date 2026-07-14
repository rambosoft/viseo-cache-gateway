# Vela Immo

Production-oriented foundation for a Moroccan property agency platform. The repository is a pnpm/Turborepo TypeScript modular monolith. This stage contains workspace and quality configuration only; the Next.js and Cloudflare Worker applications are intentionally not scaffolded yet.

## Prerequisites

- Node.js 24.18.0 LTS (see `.nvmrc`)
- pnpm 11.13.0 (pinned by `packageManager`)
- Git

The directory currently belongs to the Git worktree rooted at `C:\workspace`; no nested repository was created.

## Install

```shell
corepack enable
pnpm install
```

Use `pnpm install --frozen-lockfile` in CI after the lockfile has been generated and committed.

## Root commands

| Command             | Purpose                                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------------------- |
| `pnpm dev`          | Start workspace development after applications are scaffolded; currently fails with a clear message. |
| `pnpm build`        | Build deployables after scaffolding; currently fails with a clear message.                           |
| `pnpm lint`         | Lint repository JavaScript tooling. TypeScript correctness is enforced by `typecheck`.               |
| `pnpm typecheck`    | Type-check all workspace packages through Turbo.                                                     |
| `pnpm test`         | Run the unit-test suite.                                                                             |
| `pnpm test:unit`    | Run foundation/unit tests with Vitest.                                                               |
| `pnpm test:e2e`     | Run end-to-end tests after application scaffolding; currently fails clearly.                         |
| `pnpm format`       | Format supported repository files with Prettier.                                                     |
| `pnpm format:check` | Check formatting without changing files.                                                             |
| `pnpm clean`        | Remove generated output inside this repository.                                                      |

## Layout

- `apps/`: future public web, admin web, API Worker, and background Worker deployables.
- `packages/`: shared configuration and modular-monolith packages.
- `docs/`: architecture decisions, business/product knowledge, security, UX, planning, and runbooks.
- `tools/`: repository-only validation and maintenance scripts.

Every workspace member is intentionally a minimal TypeScript placeholder. Business behavior, framework dependencies, deployment configuration, database schemas, and API contracts will be added in later reviewed steps.

## Current linting boundary

The stable TypeScript baseline is 7.0.2, while stable `typescript-eslint` 8.64.0 currently declares support only below TypeScript 6.1. It has intentionally not been installed. ESLint checks JavaScript tooling files and `tsc` strictly checks all TypeScript placeholders. Re-evaluate the TypeScript ESLint parser before product TypeScript is introduced; do not add it with an unsupported peer range.
