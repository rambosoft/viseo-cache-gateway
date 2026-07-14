# Initial assumptions and tooling baseline

Status: planning only  
Verified: 2026-07-15 (Africa/Casablanca)  
Scope: repository preparation; no application scaffolding, runtime code, or dependencies have been added.

## Architecture held constant

The agreed direction remains a TypeScript modular monolith in a pnpm/Turborepo workspace. It will contain Next.js public and authenticated web applications deployed to Cloudflare Workers through the currently supported official adapter, plus a standalone Hono API Worker. PostgreSQL is the principal database, accessed from Workers through Hyperdrive with a Worker-compatible driver and Drizzle ORM. Database changes use reviewed, explicit SQL migrations. R2 stores uploads, Queues handles background work, REST/OpenAPI and Zod define and validate API contracts, Vitest and Playwright provide testing, and Expo React Native clients may be added later. No microservices are proposed initially.

## Environment and repository findings

- `C:\workspace\vela-immo` was empty before this document was created: it contained no source, configuration, hidden files, or local `.git` directory.
- The directory is nevertheless inside an existing Git worktree whose root is `C:\workspace`. The current branch is `main`, tracking `origin/main`, and was two commits ahead at inspection time.
- The parent worktree contains many modified and untracked sibling paths unrelated to this project. They were not opened, changed, staged, or cleaned. Future commands must be scoped to `C:\workspace\vela-immo`; a later decision is required on whether this platform should remain a subdirectory of that broad repository or become its own repository.
- Existing files in the target directory: none. Consequently there is no legacy product code to preserve or classify. This planning document is the only new file in this step.
- Host: Windows/PowerShell; timezone `Africa/Casablanca`.

| Local tool | Installed version | Finding |
| --- | ---: | --- |
| Node.js | 22.22.2 | Installed through nvm-windows; supported but no longer the preferred baseline. |
| pnpm | 9.15.0 | Installed; older than the proposed workspace version. |
| Corepack | 0.34.6 | Installed. Use only after validating the selected Node distribution's Corepack behavior. |
| npm | 10.9.7 | Installed and used to inspect registry metadata. |
| Git | 2.53.0.windows.3 | Installed. |
| Docker | 28.5.1 | Installed; suitable for a local PostgreSQL container after repository setup. |
| Turbo | not global | Expected to be a workspace dev dependency, invoked with `pnpm exec turbo`. |
| Wrangler | not global | Expected to be a workspace dev dependency, invoked with `pnpm exec wrangler`. |
| PostgreSQL CLI (`psql`) | not found | Use a container initially or install a matching client later. |

## Proposed stable version baseline

Versions below are exact stable releases observed from official package metadata on 2026-07-15. Prerelease, canary, beta, RC, experimental, and `next` tags are deliberately excluded. Exact versions should be written to the initial lockfile; automated dependency updates can then be reviewed normally.

| Component | Proposed version | Basis / note |
| --- | ---: | --- |
| Node.js | 24.18.0 LTS | Active LTS production baseline. Do not select Node 26 while it is Current rather than LTS. |
| pnpm | 11.13.0 | Stable `latest`; requires Node `>=22.13`, satisfied by Node 24. |
| Turborepo (`turbo`) | 2.10.5 | Stable `latest`. |
| TypeScript | 7.0.2 | Stable `latest`, not the 7.1 dev line; validate framework/type ecosystem before locking. |
| Next.js | 16.2.10 | Stable `latest`; falls inside the adapter's supported Next 16 range. |
| React / React DOM | 19.2.7 | Matching stable pair required by `react-dom`. |
| Cloudflare Next adapter | `@opennextjs/cloudflare` 1.20.1 | Officially documented Cloudflare Workers adapter. Peer range is Next `>=15.5.18 <16 || >=16.2.6`; Wrangler peer is `^4.86.0`. |
| Hono | 4.12.30 | Stable `latest`. |
| Zod | 4.4.3 | Stable `latest`. |
| Hono OpenAPI integration | `@hono/zod-openapi` 1.5.0 | Stable; peers Hono `>=4.10.0` and Zod `^4`. Use only if selected during API contract design. |
| Drizzle ORM | 0.45.2 | Stable `latest`; do not adopt the 1.0 beta/RC line. |
| Drizzle Kit | 0.31.10 | Stable `latest`; do not adopt the 1.0 beta/RC line. |
| PostgreSQL | 18.4 | Current supported stable minor; PostgreSQL 19 is beta and excluded. |
| PostgreSQL Worker driver | `pg` 8.22.0 | Proposed because Cloudflare recommends node-postgres for Hyperdrive compatibility/caching. Confirm Drizzle + Workers runtime behavior in a spike. |
| Alternative driver | `postgres` 3.4.9 | Supported by Hyperdrive (minimum 3.4.5); retain only as fallback if the `pg` spike fails. Do not install both by default. |
| Wrangler | 4.110.0 | Stable `latest`; supports Node `>=22` and satisfies the adapter peer range. |
| Workers types | `@cloudflare/workers-types` 5.20260714.1 | Stable snapshot observed; prefer generated binding types via `wrangler types`. |
| Vitest | 4.1.10 | Stable `latest`; Node 24 is supported. |
| Playwright Test | 1.61.1 | Stable `latest`; official requirements include current Node 24.x. |
| Expo | 57.0.4 | Stable `latest`, recorded for later only; do not add mobile packages in the initial web/API scaffold. |
| TS runner (if needed) | `tsx` 4.23.1 | Stable; add only when a concrete script requires it. |

Authoritative references checked:

- [Cloudflare Next.js on Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
- [Cloudflare automatic framework configuration](https://developers.cloudflare.com/workers/framework-guides/automatic-configuration/)
- [Cloudflare Hyperdrive with Postgres.js (also states the `pg` recommendation)](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/postgres-js/)
- [Node.js release status](https://nodejs.org/en/about/previous-releases)
- [Node.js 24.18.0 LTS release](https://nodejs.org/en/blog/release/v24.18.0)
- [PostgreSQL versioning policy](https://www.postgresql.org/support/versioning/)
- [Playwright installation and system requirements](https://playwright.dev/docs/intro)

Package versions and peer/engine ranges were checked with `npm view <package> dist-tags engines peerDependencies version --json`. Re-check all versions immediately before scaffolding because registry releases and adapter compatibility ranges can change.

## Compatibility concerns and validation gates

1. **Node alignment:** local Node 22.22.2 can run most tools and pnpm 11, but development and CI should converge on exact Node 24.18.0 to avoid environment drift. Upgrade locally before generating the lockfile.
2. **TypeScript 7 ecosystem:** 7.0.2 is stable but new. Before committing it, run Next, OpenNext, Hono, Drizzle, Vitest, and generated Worker types through a minimal compile/build matrix. If a confirmed incompatibility exists, pin the newest supported stable TypeScript release and document why; do not silently downgrade.
3. **OpenNext/Next coupling:** keep Next within the adapter's published peer range. Validate every adapter or Next upgrade with a Cloudflare-runtime preview, not only `next dev`.
4. **Workers runtime differences:** use `nodejs_compat`, a current `compatibility_date`, generated Wrangler binding types, and runtime-preview tests. Cloudflare currently notes that Node.js middleware is not supported by the adapter; avoid depending on it until verified.
5. **Database driver:** Cloudflare recommends `pg`, while Postgres.js is also supported. Prove Drizzle migrations/queries, TLS, prepared statements, transactions, Hyperdrive caching, and connection limits with `pg` before settling the database package. Migration execution should use a direct administrative database URL in controlled CI/deployment, not a request-time Worker path through Hyperdrive.
6. **PostgreSQL hosting:** provider, Moroccan/EU data residency needs, backups/PITR, connection limits, extensions, and Hyperdrive network reachability are undecided. PostgreSQL 18.4 is the desired baseline only if the selected managed provider supports it.
7. **R2 and documents:** define upload size/type rules, malware scanning, signed URL policy, retention, legal access, and Queue retry/dead-letter behavior before implementation.
8. **Monorepo deployments:** multiple Next.js apps plus an API Worker require explicit per-app Wrangler/OpenNext configuration and CI matrices. Do not rely blindly on automatic framework detection in a multi-framework workspace.
9. **Corepack:** Corepack distribution/support has changed across Node releases. Record the package manager in `package.json` and CI, then validate the selected bootstrap method on clean Windows and Linux runners.
10. **Windows versus Linux:** local development is Windows, while CI and Workers build environments are commonly Linux. Enforce case-safe paths, LF normalization, shell-portable scripts, and run CI on Linux.

## Open assumptions

- A single company/agency may be the initial tenant, but owner/agency boundaries should not prevent later multi-agency operation. Tenancy and authorization need a product decision before schema design.
- The modular monolith will organize business capabilities (inventory/listings, availability, reservations, guests, owners/agencies, operations/cleaning, finance/payouts, documents, integrations, identity/access) behind internal module boundaries rather than deployable services.
- The standalone API Worker is the canonical REST/OpenAPI boundary for authenticated web and future mobile clients. Next.js route handlers should remain web-specific unless an exception is documented.
- Reservation sources (direct, Airbnb, Booking.com, manual, WhatsApp/social) require a normalized source model plus immutable external identifiers and an audit trail. Channel synchronization ownership and conflict rules remain undefined.
- Money uses integer minor units or an explicit exact decimal strategy, never JavaScript floating point. Supported currencies, taxes/VAT, commission rules, refunds, deposits, owner payout statements, and accounting periods require validation.
- Store timestamps as UTC instants while preserving property-local timezone and source timezone where operationally relevant. Morocco DST/Ramadan transitions need domain tests.
- Public localization likely includes French and Arabic, with English potentially included; exact languages, RTL requirements, translated slugs/content, and locale fallback are not yet approved.
- Google Sheets and existing calendar projects are migration/integration sources, not the future system of record. Their schemas, data quality, identifiers, formulas, and ownership must be inventoried before migration design.
- Contracts, identity documents, and guest data are sensitive. Roles, consent, retention, deletion, encryption, audit logging, and applicable Moroccan privacy/legal requirements require specialist validation.
- Expo is intentionally deferred; shared API schemas/types should be runtime-neutral and must not import Worker- or Next-specific modules.

## Decisions requiring later validation

- Repository boundary: dedicated Git repository versus directory in `C:\workspace`.
- Managed PostgreSQL provider, region, PostgreSQL 18 support, disaster recovery, and environment topology.
- Authentication provider/session model, MFA, roles, permissions, agency/owner/staff access, and audit requirements.
- Exact app layout and deployable count (public web, operations/admin web, API Worker, Queue consumer arrangement).
- Whether Queue consumers live in the API Worker deployment or a separately deployed Worker; this is an operational deployment decision, not a move to microservices.
- OpenAPI generation/client strategy and whether `@hono/zod-openapi` is adopted.
- Reservation state machine, availability locking, idempotency, double-booking prevention, and channel-sync conflict policy.
- Payment providers, PCI scope, currencies, tax/accounting model, commission calculations, expense approval, owner payout workflow, and reconciliation.
- R2 bucket/environment layout and document lifecycle/security controls.
- Initial locales and content management/translation workflow.
- Observability, alerting, error tracking, log redaction, SLOs, backup restore exercises, and incident ownership.

## Expected development and CI commands

These are the intended command contract for the next scaffold; they are not runnable yet because no workspace or dependencies exist. Prefer root scripts that delegate through Turbo and package scripts rather than global binaries.

```text
pnpm install --frozen-lockfile
pnpm dev
pnpm build
pnpm typecheck
pnpm lint
pnpm test
pnpm test:integration
pnpm test:e2e
pnpm format:check
pnpm db:generate
pnpm db:migrate
pnpm db:check
pnpm cf:typegen
pnpm preview
pnpm deploy
```

Expected lower-level forms, useful for debugging and CI matrices:

```text
pnpm exec turbo run build typecheck lint test
pnpm exec vitest run
pnpm exec playwright install --with-deps
pnpm exec playwright test
pnpm exec drizzle-kit generate
pnpm exec drizzle-kit migrate
pnpm exec wrangler types
pnpm --filter <next-app> preview
pnpm --filter <worker> exec wrangler dev
pnpm --filter <deployable> deploy
```

The eventual CI order should be: validate pinned Node/pnpm versions, frozen install, format/lint, typecheck, unit tests, build, migration verification against disposable PostgreSQL 18.4, Cloudflare-runtime integration/preview tests, then Playwright. Deployment and production migrations require protected environments and explicit approval.

## Next-session entry criteria

Before scaffolding, resolve or explicitly accept the repository boundary, upgrade local Node/pnpm to the pinned baseline, re-check package/adapter compatibility, and agree on the initial deployable app layout. The first scaffold must not introduce business behavior; it should establish workspace structure, quality gates, environment validation, and a minimal Cloudflare/PostgreSQL compatibility spike.
