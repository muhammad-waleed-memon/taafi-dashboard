# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in TAAFI AI, please report it responsibly:

1. **DO NOT** create a public GitHub issue.
2. Send an email to the project maintainer with details.
3. Include steps to reproduce, impact assessment, and suggested fix if possible.

## Security Measures

TAAFI AI implements the following security measures:

- **Authentication**: JWT-based auth with bcrypt password hashing
- **Encryption**: PQC-ready crypto engine (SHA3-256 + AES-256-GCM)
- **Transport**: gRPC + mTLS between services
- **Authorization**: Role-based access control (RBAC)
- **Rate Limiting**: SlowAPI with Redis backend
- **Input Validation**: Pydantic v2 with strict validation
- **SQL Injection Prevention**: SQLAlchemy ORM with parameterized queries
- **CORS**: Configured for specific origins only
- **Security Headers**: X-Frame-Options, CSP, HSTS via Nginx
- **GDPR Compliance**: EU region deployment verification
- **Audit Logging**: Full structured logging with tracing

## Compliance

- GDPR (General Data Protection Regulation)
- PCI DSS (Payment Card Industry Data Security Standard)
- SOX (Sarbanes-Oxley Act)
- DORA (Digital Operational Resilience Act)
