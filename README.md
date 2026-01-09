# Secret-Zero

**Secret-Zero** is an Inbound Secret Collection Portal (ISCP): a secure B2B app that lets consulting clients deposit sensitive credentials (passwords, API tokens, keys) directly into your [Infisical](https://infisical.com) vault without email/Slack. Think of it as a **digital safe deposit box** where clients can securely deposit secrets that only your authorized team can access.

![Secure Credential Transfer Form](public/form_screenshot.png)

## What it solves
- Prevents “secret sprawl” and insecure credential sharing across communication tools.
- Reduces operational risk (leaks, misdelivery, screenshots, forwarding) and supports compliance-oriented workflows by making the deposit flow auditable and structured.
- Makes deposited secrets immediately usable in the secret manager (no manual copy/paste), with **granular access control** for internal teams.
- Doesn’t burden non-technical users with yet another password — authentication uses **email magic links**.

## Security model (high level)
- **Client-side encryption** (payload is encrypted in the browser before it reaches the server runtime).
- **Write-only vault** in Infisical (the app can create secrets, but cannot read/list/update/delete them).
- **[Stytch](https://stytch.com) B2B** authentication to tie deposits to verified client organizations.
- **Minimal logging** (avoid request/body logging; never log secret values).

## Operational assumptions
- **No database to run or maintain** — the app is stateless and relies on [Stytch](https://stytch.com) (auth) and [Infisical](https://infisical.com) (secret storage).
- **Organizations in Stytch** can be created via API as part of client onboarding flow, but can also be created directly in Stytch dashboard. This application does not contain a management dashboard.

## Documentation
- Product & architecture: [docs/PRD.md](docs/PRD.md)
- Setup guides: [docs/INFISICAL_SETUP.md](docs/INFISICAL_SETUP.md), [docs/STYTCH_SETUP.md](docs/STYTCH_SETUP.md), [docs/VERCEL_DEPLOYMENT.md](docs/VERCEL_DEPLOYMENT.md)
- Testing & security procedures: [docs/INFISICAL_TESTING.md](docs/INFISICAL_TESTING.md), [docs/STYTCH_TESTING.md](docs/STYTCH_TESTING.md), [docs/SECURITY_TESTS.md](docs/SECURITY_TESTS.md)

## Quick start (local)

Requirements: Node.js 20+, `pnpm`.

1. Configure integrations: [docs/INFISICAL_SETUP.md](docs/INFISICAL_SETUP.md) and [docs/STYTCH_SETUP.md](docs/STYTCH_SETUP.md).
2. Create local environment file:
   ```bash
   cp env.example .env.local
   ```
3. Fill `.env.local` (see [docs/VERCEL_DEPLOYMENT.md](docs/VERCEL_DEPLOYMENT.md) for full context). At minimum you need:
   - Stytch B2B credentials
   - Infisical machine identity credentials
   - RSA key pair (server private key + public key)
4. Install and run:

```bash
pnpm install
pnpm dev
```

App: http://localhost:3000

## Commands

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm test:infisical
pnpm test:stytch
```

## Security (short)

- Don’t commit secrets or private keys (this repo ignores `.env*` and `*.pem`).
- Before production deploy, run the checklist: [docs/SECURITY_TESTS.md](docs/SECURITY_TESTS.md).

## License

MIT License. See [LICENSE](LICENSE).

Copyright (c) Grzegorz Zawłodzki — <https://zawlodzki.pl>
