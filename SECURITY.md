# Security Policy

## Reporting Security Vulnerabilities

We take the security of CodeHeroes seriously. If you discover a security vulnerability, please follow these steps:

### 🔒 Private Disclosure

**DO NOT** create a public GitHub issue for security vulnerabilities.

Instead:
1. **Email:** Send details to [security contact email - UPDATE THIS]
2. **Subject Line:** "SECURITY: [Brief Description]"
3. **Include:**
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline

- **Initial Response:** Within 48 hours
- **Status Update:** Within 1 week
- **Fix Timeline:** Critical issues within 2 weeks

### What to Expect

1. **Acknowledgment:** We'll confirm receipt of your report
2. **Investigation:** We'll investigate and validate the issue
3. **Fix Development:** We'll develop and test a fix
4. **Disclosure:** We'll coordinate disclosure timing with you
5. **Credit:** We'll credit you in release notes (if desired)

---

## Security Update Policy

### Regular Security Audits

- **Schedule:** Every 6 months
- **Scope:** Full codebase and dependencies
- **Documentation:** Results published in security reports

### Dependency Updates

- **Automated:** Dependabot checks daily
- **Review:** Security updates reviewed within 48 hours
- **Deployment:** Critical updates deployed within 1 week

### Security Patches

- **Critical:** Deployed within 24-48 hours
- **High:** Deployed within 1 week
- **Medium:** Deployed within 1 month
- **Low:** Included in next regular release

---

## Supported Versions

| Version | Supported          | Security Updates |
| ------- | ------------------ | ---------------- |
| 1.x.x   | ✅ Yes             | Yes              |
| 0.x.x   | ⚠️ Beta/Dev only   | Critical only    |

---

## Security Best Practices

### For Contributors

When contributing code:

1. **Never commit secrets** (API keys, passwords, tokens)
2. **Validate all inputs** using Zod schemas
3. **Use parameterized queries** to prevent injection
4. **Sanitize user input** before displaying in UI
5. **Follow OWASP Top 10** guidelines
6. **Run security checks** before submitting PR:
   ```bash
   npm run security:check
   npm audit
   ```

### For Maintainers

1. **Review security implications** of all PRs
2. **Enable branch protection** on main/production branches
3. **Require security reviews** for sensitive changes
4. **Monitor security advisories** for dependencies
5. **Keep secrets in environment variables** or secret managers
6. **Rotate secrets regularly** (every 90 days)

---

## Known Security Considerations

### Current Security Status (as of Feb 7, 2026)

See `SECURITY_AUDIT_SUMMARY.md` for latest audit results.

**Critical Issues (In Progress):**
- Webhook signature validation implementation
- API input validation
- CORS configuration hardening
- Dependency updates

**Mitigations in Place:**
- Firebase Security Rules (strong)
- Firebase Authentication (strong)
- No hardcoded secrets
- HTML sanitization

---

## Security Features

### Authentication & Authorization

- **Firebase Authentication:** Industry-standard OAuth 2.0
- **Token Validation:** All API endpoints require valid Firebase ID tokens
- **Token Expiry:** Automatic token refresh and expiration handling
- **Role-Based Access:** User types (user, bot, system) for future RBAC

### Data Protection

- **Firestore Security Rules:** Strict access control on all collections
- **Encryption at Rest:** Firebase handles encryption automatically
- **Encryption in Transit:** TLS 1.2+ for all connections
- **Storage Security:** Admin SDK only access

### API Security

- **CORS Protection:** Allowlist of trusted domains
- **Rate Limiting:** Protection against brute force and DoS
- **Input Validation:** Zod schema validation on all endpoints
- **Security Headers:** Helmet.js middleware
- **Request Size Limits:** Prevent memory exhaustion attacks

### Webhook Security

- **Signature Validation:** HMAC-SHA256 verification
- **Replay Protection:** Event ID deduplication
- **Source Validation:** Only accept from verified providers

---

## Compliance

### GDPR Compliance

We are committed to GDPR compliance:

- **Data Access:** Users can request their data
- **Data Deletion:** Users can request account deletion
- **Data Portability:** Data export functionality
- **Privacy by Design:** Minimal data collection

**To Request Your Data:**
1. Email: [data protection contact - UPDATE THIS]
2. Subject: "GDPR Data Request"
3. Include: Your account email/ID

**Response Time:** Within 30 days

### Data Retention

- **User Accounts:** Indefinite (while active)
- **Activity Logs:** 90 days
- **Audit Logs:** 1 year
- **Webhook Data:** 30 days

---

## Security Monitoring

### What We Monitor

- Failed authentication attempts
- Rate limit violations
- Invalid webhook signatures
- Input validation failures
- Unusual API usage patterns
- Dependency vulnerabilities

### Incident Response

1. **Detection:** Automated monitoring alerts
2. **Assessment:** Evaluate severity and impact
3. **Containment:** Isolate affected systems
4. **Remediation:** Deploy fixes
5. **Recovery:** Restore normal operations
6. **Review:** Post-incident analysis

---

## Security Tooling

### In Use

- **npm audit:** Dependency vulnerability scanning
- **CodeQL:** Static code analysis
- **Dependabot:** Automated dependency updates
- **Firebase Security Rules:** Runtime access control
- **ESLint:** Code quality and security linting

### Planned

- **OWASP ZAP:** Dynamic application security testing
- **Snyk:** Real-time vulnerability monitoring
- **SonarQube:** Code quality and security analysis

---

## Contact

### Security Team

- **Email:** [security email - UPDATE THIS]
- **PGP Key:** [Optional - add PGP key for encrypted communications]

### Response Hours

- **Business Hours:** Mon-Fri, 9am-5pm CET
- **Emergency:** 24/7 for critical vulnerabilities

---

## Acknowledgments

We thank the following security researchers for responsible disclosure:

- [List will be maintained here]

---

## Version History

| Date       | Version | Changes                          |
|------------|---------|----------------------------------|
| 2026-02-07 | 1.0     | Initial security policy created  |

---

**Last Updated:** February 7, 2026  
**Next Review:** August 7, 2026

For questions about this security policy, contact [security email - UPDATE THIS].
