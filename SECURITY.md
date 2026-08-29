# Security Policy

## Scope

This repository is a public portfolio demonstration. It must not contain production
credentials, customer data, protected health information, proprietary employer or
client information, or production infrastructure configuration.

## Reporting a vulnerability

Please do not open a public GitHub issue for a suspected security vulnerability.

Report it privately through the contact form at https://www.utmostconnect.org/.
Include a clear description, reproduction steps, potential impact, and any
suggested mitigation. Acknowledgment and remediation will be prioritized based on
severity and reproducibility.

## Development safeguards

- Store secrets only in environment variables or an approved secret manager.
- Never commit `.env` files, tokens, API keys, database credentials, or private keys.
- Use synthetic or de-identified data in public environments.
- Keep production integrations disabled in the portfolio demo.
- Treat the public demo as read-only unless authentication, authorization,
  audit logging, and validation are implemented.
