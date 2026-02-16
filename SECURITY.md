# Security Policy

## Reporting a Vulnerability

Please **do not** open public issues for security-sensitive reports.
Use GitHub **Security Advisories / Private Vulnerability Reporting** for this repo.

## Security notes

VIRAITH IDE is a **local desktop IDE** (Tauri) and is intentionally powerful:
- it can read/write files you open
- it can connect to local model providers on `localhost`

Do not open untrusted projects if you are concerned about local data access.

## Secrets

- Never commit API keys or tokens.
- Use `.env.local` for real keys; `.env.example` must contain placeholders only.
- `NEXT_PUBLIC_*` env vars are bundled into the frontend by Next.js; do not treat them as server-only secrets.
