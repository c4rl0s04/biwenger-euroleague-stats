# Security Policy

## Supported Versions

This is a personal/portfolio project. Security patches are applied to the latest version only.

| Version | Supported |
| ------- | --------- |
| Latest  | ✅        |
| Older   | ❌        |

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

If you discover a security vulnerability, please report it responsibly:

1. **Email**: Send details to the repository owner via GitHub's private messaging
2. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if you have one)

You can expect an acknowledgment within **48 hours** and a resolution within **7 days** for critical issues.

## Security Considerations for Self-Hosting

If you are running your own instance of this application:

- **Never commit `.env`** — keep it in `.gitignore` (already configured)
- **Rotate `AUTH_SECRET`** — generate a strong random secret: `openssl rand -base64 32`
- **Use environment variables** for all credentials (Biwenger token, DB password)
- **Keep dependencies updated** — run `npm audit` regularly or enable Dependabot
- **PostgreSQL access** — ensure your database is not publicly accessible; use connection strings with strong passwords
- **Docker networking** — do not expose the PostgreSQL container port (`5432`) to the public internet in production

## Dependency Security

This project uses [Dependabot](.github/dependabot.yml) for automated dependency update PRs.
Run `npm audit` to check for known vulnerabilities in current dependencies.
