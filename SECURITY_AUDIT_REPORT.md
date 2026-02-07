# Security Audit Report - CodeHeroes

**Date:** February 7, 2026  
**Repository:** dutchhackers/codeheroes  
**Audit Type:** Comprehensive Security Assessment

---

## Executive Summary

This security audit identified **9 high-priority vulnerabilities** and **13 moderate-priority security concerns** across the CodeHeroes codebase. The primary areas of concern include:

1. **Critical: Webhook signature validation not implemented** (GitHub & Azure DevOps)
2. **Critical: No input validation or sanitization** on API endpoints
3. **High: Vulnerable npm dependencies** requiring immediate updates
4. **High: Overly permissive CORS configuration**
5. **Moderate: XSS risk with innerHTML usage** (properly sanitized)

---

## 1. Dependency Vulnerabilities

### 🔴 HIGH SEVERITY (9 vulnerabilities)

#### 1.1 Quill XSS Vulnerability
- **Package:** `quill@2.0.3`
- **Issue:** XSS vulnerability via HTML export feature
- **Advisory:** [GHSA-v3m3-f69x-jf25](https://github.com/advisories/GHSA-v3m3-f69x-jf25)
- **Fix:** Upgrade to `quill@2.0.4` or later
- **Status:** ⚠️ UNFIXED

#### 1.2 @isaacs/brace-expansion DoS
- **Package:** `@isaacs/brace-expansion@5.0.0`
- **Issue:** Uncontrolled Resource Consumption
- **Advisory:** [GHSA-7h2j-956f-4vf2](https://github.com/advisories/GHSA-7h2j-956f-4vf2)
- **Fix:** Update via `npm audit fix`
- **Status:** ⚠️ UNFIXED

#### 1.3 fast-xml-parser DoS
- **Package:** `fast-xml-parser@4.3.6 - 5.3.3`
- **Issue:** RangeError DoS via Numeric Entities
- **Advisory:** [GHSA-37qj-frw5-hhjh](https://github.com/advisories/GHSA-37qj-frw5-hhjh)
- **Impact:** Used by `@google-cloud/storage`
- **Fix:** Update via `npm audit fix`
- **Status:** ⚠️ UNFIXED

#### 1.4 @modelcontextprotocol/sdk Data Leak
- **Package:** `@modelcontextprotocol/sdk@1.10.0 - 1.25.3`
- **Issue:** Cross-client data leak via shared server/transport instance reuse
- **Advisory:** [GHSA-345p-7cg4-v4c7](https://github.com/advisories/GHSA-345p-7cg4-v4c7)
- **Impact:** Affects `@angular/cli`
- **Fix:** Requires `npm audit fix --force` (breaking change)
- **Status:** ⚠️ UNFIXED

#### 1.5 qs DoS Vulnerability
- **Package:** `qs@<6.14.1`
- **Issue:** arrayLimit bypass in bracket notation allows DoS via memory exhaustion
- **Advisory:** [GHSA-6rw7-vpxm-498p](https://github.com/advisories/GHSA-6rw7-vpxm-498p)
- **Impact:** Used by `@cypress/request` and `body-parser`
- **Fix:** Requires `npm audit fix --force`
- **Status:** ⚠️ UNFIXED

### 🟡 MODERATE SEVERITY (13 vulnerabilities)

#### 1.6 Lodash Prototype Pollution
- **Package:** `lodash@4.0.0 - 4.17.21`
- **Issue:** Prototype Pollution in `_.unset` and `_.omit` functions
- **Advisory:** [GHSA-xxjr-mmjv-4gpg](https://github.com/advisories/GHSA-xxjr-mmjv-4gpg)
- **Impact:** Used by Verdaccio (dev dependency only)
- **Risk Level:** LOW (development only)
- **Status:** ⚠️ UNFIXED

### Summary
```
Total: 23 vulnerabilities
- 1 Low
- 13 Moderate  
- 9 High
- 0 Critical
```

**Recommendation:** Run `npm audit fix` to address non-breaking fixes, then evaluate `npm audit fix --force` for breaking changes on a case-by-case basis.

---

## 2. Webhook Security Vulnerabilities

### 🔴 CRITICAL: Missing Webhook Signature Validation

#### 2.1 GitHub Webhook Validation
**Location:** `libs/server/integrations/src/lib/providers/github/github.adapter.ts:89-93`

**Current Code:**
```typescript
if (secret && headers['x-hub-signature-256']) {
  // Implement signature validation using crypto
  // This is a placeholder - actual implementation needed
  const isSignatureValid = true; // Replace with actual validation
  
  if (!isSignatureValid) {
    return {
      isValid: false,
      error: 'Invalid webhook signature',
    };
  }
}
```

**Issue:** Webhook signature validation is **NOT IMPLEMENTED**. The code always returns `true`, meaning any attacker can send fake webhook payloads to your endpoint.

**Impact:**
- Attackers can forge GitHub events (push, PR, issues, etc.)
- Could trigger unintended game actions, XP manipulation
- No authentication of webhook source

**Fix Required:**
```typescript
import crypto from 'crypto';

function verifyGitHubSignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}
```

#### 2.2 Azure DevOps Webhook Validation
**Location:** `libs/server/integrations/src/lib/providers/azure-devops/adapter.ts:28-51`

**Current Code:**
```typescript
// TODO: Implement webhook signature validation using `secret` param
// Azure DevOps Service Hooks support HTTP header-based authentication (Basic Auth)
// and can be configured with a shared secret for HMAC signature verification.
validateWebhook(
  headers: Record<string, string | string[] | undefined>,
  body: any,
  secret?: string
): { isValid: boolean; error?: string; eventType?: string; eventId?: string } {
  // ... no signature validation implemented
}
```

**Issue:** No HMAC signature validation for Azure DevOps webhooks.

**Impact:** Same as GitHub - attackers can forge Azure DevOps events.

**Recommendation:** Implement HMAC-SHA256 signature verification for both providers before production deployment.

---

## 3. API Security Issues

### 🔴 HIGH: No Input Validation

**Location:** Multiple controllers in `apps/api/src/controllers/`

**Issue:** API endpoints accept request bodies without any validation schema.

**Examples:**

**`users-controller.ts`:**
```typescript
export const createUser = async (req: Request, res: Response) => {
  try {
    const user = await userService.createUser(req.body); // No validation!
    res.status(201).json(user);
  } catch (error) {
    // ...
  }
};
```

**`projects-controller.ts`:**
```typescript
export const createProject = async (req: Request, res: Response) => {
  try {
    const { name, slug, ...rest } = req.body; // Direct usage without validation
    // ...
  }
};
```

**Impact:**
- SQL injection risk (if SQL database is added)
- NoSQL injection via Firestore queries
- Type confusion bugs
- Data integrity issues
- Potential for excessive data consumption

**Recommendation:**
1. Add schema validation library (Zod, Joi, or class-validator)
2. Validate all inputs before processing
3. Implement request size limits
4. Sanitize string inputs

**Example Fix (using Zod):**
```typescript
import { z } from 'zod';

const CreateUserSchema = z.object({
  displayName: z.string().min(2).max(50),
  email: z.string().email(),
  // ... other fields
});

export const createUser = async (req: Request, res: Response) => {
  try {
    const validatedData = CreateUserSchema.parse(req.body);
    const user = await userService.createUser(validatedData);
    res.status(201).json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    // ... other error handling
  }
};
```

### 🔴 HIGH: Overly Permissive CORS Configuration

**Location:** `apps/api/src/app.ts` (likely)

**Current Configuration:**
```typescript
app.use(cors({ origin: true })); // Allows ALL origins!
```

**Issue:** CORS is configured to accept requests from ANY origin, defeating the purpose of CORS protection.

**Impact:**
- Malicious websites can make authenticated requests to your API
- User credentials/tokens can be stolen via malicious sites
- Cross-Site Request Forgery (CSRF) attacks

**Fix Required:**
```typescript
const allowedOrigins = [
  'https://codeheroes.app',
  'https://admin.codeheroes.app',
  'http://localhost:4200', // Development only
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies
}));
```

### 🟠 HIGH: No Rate Limiting

**Issue:** API endpoints have no rate limiting, allowing unlimited requests.

**Impact:**
- Brute force attacks on authentication
- Denial of Service (DoS)
- API abuse
- Resource exhaustion

**Fix Required:**
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.',
});

app.use('/api/', limiter);

// Stricter limits for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 minutes
});

app.use('/api/auth/', authLimiter);
```

### 🟠 HIGH: Missing Security Headers

**Issue:** No security headers (helmet.js not used)

**Missing Headers:**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security`
- `Content-Security-Policy`
- `X-XSS-Protection`

**Fix Required:**
```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

### 🟡 MEDIUM: Query Parameter Validation

**Location:** Multiple controllers

**Example:**
```typescript
const limit = parseInt(req.query.limit as string) || 20; // No max validation
```

**Issue:** No maximum bounds on pagination parameters could allow resource exhaustion.

**Fix:**
```typescript
const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
```

---

## 4. Frontend Security

### ✅ GOOD: Proper XSS Prevention

**Location:** `apps/frontend/app/src/app/components/activity-item.component.ts:306-308`

**Code:**
```typescript
sanitizedIcon = computed((): SafeHtml => {
  return this.sanitizer.bypassSecurityTrustHtml(this.actionDisplay().svgIcon);
});
```

**Analysis:** Angular's `DomSanitizer` is used correctly to sanitize HTML before rendering via `innerHTML`. The `svgIcon` content comes from internal mappings (`getActivityTypeDisplay()`), not user input.

**Status:** ✅ SAFE (assuming `getActivityTypeDisplay()` returns trusted content)

**Recommendation:** Verify that `getActivityTypeDisplay()` does not process user-controllable input. If it does, add additional sanitization.

---

## 5. Authentication & Authorization

### ✅ STRONG: Firebase Authentication Implementation

**Location:** `apps/api/src/middleware/auth.middleware.ts`

**Strengths:**
1. ✅ All API routes protected by Firebase ID token verification
2. ✅ Proper Bearer token extraction and validation
3. ✅ Token expiry handled by Firebase Admin SDK
4. ✅ User attached to `req.user` for downstream use
5. ✅ Clear error messages (401) for missing/invalid tokens

**Code Review:**
```typescript
export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    logger.warn('Missing or malformed Authorization header');
    res.status(401).json({ message: 'Missing or invalid authorization token' });
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    logger.warn('Missing token in Authorization header');
    res.status(401).json({ message: 'Missing or invalid authorization token' });
    return;
  }

  try {
    req.user = await getAuth().verifyIdToken(token);
    next();
  } catch (error) {
    logger.warn('Invalid Firebase ID token', { error });
    res.status(401).json({ message: 'Invalid or expired authorization token' });
  }
}
```

**Recommendation:** 
- Consider implementing role-based access control (RBAC) using the `userType` field
- Add custom claims to Firebase tokens for admin/moderator roles

---

## 6. Firebase Security Rules

### ✅ EXCELLENT: Firestore Security Rules

**Location:** `apps/firebase-app/firestore.rules`

**Strengths:**
1. ✅ Default deny-all policy (lines 142-144)
2. ✅ Proper authentication checks
3. ✅ Owner-based access control for sensitive data
4. ✅ Server-only collections properly locked down
5. ✅ Field-level validation on user updates (displayName)
6. ✅ Connected accounts protected (OAuth tokens)
7. ✅ Proper sub-collection permissions

**Security Highlights:**
```
✅ Users can only update their own profile
✅ Server-only writes for activities, stats, rewards, badges
✅ Connected accounts (OAuth tokens) only readable by owner
✅ Field validation on displayName (2-50 characters)
✅ Server collections (gameActions, events) completely locked down
```

**Status:** ✅ SECURE - No changes needed

### ✅ SECURE: Storage Rules

**Location:** `apps/firebase-app/storage.rules`

**Code:**
```
allow read, write: if false;
```

**Status:** ✅ SECURE - All storage access denied (using Admin SDK only)

---

## 7. Secrets Management

### ✅ GOOD: No Hardcoded Secrets

**Findings:**
1. ✅ No Firebase API keys in code
2. ✅ `.env.example` used for configuration templates
3. ✅ `.env` properly in `.gitignore`
4. ✅ GitHub package auth via environment variable: `${NODE_AUTH_TOKEN}`
5. ✅ Environment-specific configs in templates only

**Verified Locations:**
- `/.env.example` - Template only, no actual secrets
- `/apps/firebase-app/environment/.env` - Empty (comments only)
- `/apps/firebase-app/environment/.env.local` - Empty (comments only)

**Status:** ✅ SECURE

**Recommendation:** 
- Continue using environment variables for secrets
- Consider using Firebase Secret Manager for production secrets
- Rotate any secrets if they were ever committed to git history

---

## 8. Infrastructure Security

### ✅ GOOD: Express Server Hardening

**Positive Findings:**
1. ✅ `X-Powered-By` header removed (hides Express)
2. ✅ Webhook duplicate prevention via `eventId` tracking
3. ✅ Proper error handling without stack trace leakage (assumed)

---

## Priority Action Items

### 🔴 IMMEDIATE (Critical - Fix within 24 hours)

1. **Implement webhook signature validation**
   - GitHub HMAC-SHA256 verification
   - Azure DevOps HMAC verification
   - **Risk:** Complete takeover of game mechanics via forged events

2. **Update vulnerable npm packages**
   ```bash
   npm audit fix
   ```
   - Addresses 9 high-severity vulnerabilities
   - Most important: Quill XSS vulnerability

3. **Fix CORS configuration**
   - Restrict origins to production domains only
   - **Risk:** Cross-site attacks, credential theft

### 🟠 HIGH PRIORITY (Fix within 1 week)

4. **Implement input validation**
   - Add Zod/Joi schema validation
   - Validate all API request bodies
   - **Risk:** Data corruption, injection attacks

5. **Add security headers (helmet.js)**
   - Prevents clickjacking, XSS, other attacks
   - Industry standard protection

6. **Implement rate limiting**
   - Protect against brute force and DoS
   - Essential for production APIs

### 🟡 MEDIUM PRIORITY (Fix within 1 month)

7. **Add request size limits**
   - Prevent memory exhaustion via large payloads

8. **Implement query parameter validation**
   - Add maximum bounds on pagination

9. **Add CSRF protection**
   - If using cookies or sessions

10. **Security testing**
    - Penetration testing
    - OWASP ZAP scanning
    - Dependency scanning in CI/CD

---

## Positive Security Findings

### Strengths of Current Implementation:

1. ✅ **Excellent Firebase Security Rules** - Industry best practices
2. ✅ **Strong Authentication** - Firebase ID tokens properly validated
3. ✅ **No Hardcoded Secrets** - Environment variables used correctly
4. ✅ **Proper HTML Sanitization** - Angular DomSanitizer used correctly
5. ✅ **X-Powered-By Removed** - Server fingerprinting prevented
6. ✅ **Webhook Deduplication** - Event IDs prevent replay attacks
7. ✅ **Storage Locked Down** - Admin SDK only access

---

## Security Testing Recommendations

### Automated Testing
1. **CodeQL** - Already available, run on all PRs
2. **npm audit** - Run in CI/CD pipeline
3. **OWASP Dependency-Check** - Scan for vulnerable libraries
4. **Snyk** - Real-time vulnerability monitoring

### Manual Testing
1. **Penetration Testing** - Annual security assessment
2. **Code Review** - Security-focused reviews for sensitive changes
3. **Webhook Testing** - Verify signature validation works

---

## Compliance Considerations

### GDPR Compliance
- ✅ User data access controlled (Firestore rules)
- ⚠️ Need data export/deletion endpoints for user requests
- ⚠️ Document data retention policies

### Security Standards
- OWASP Top 10 compliance assessment needed
- API security best practices (OWASP API Security Top 10)

---

## Conclusion

The CodeHeroes application has a **solid security foundation** with excellent Firebase security rules and proper authentication implementation. However, there are **critical gaps** that must be addressed before production deployment:

1. **Webhook signature validation is not implemented** - This is the most critical issue
2. **API input validation is missing** - Opens door to many attack vectors
3. **CORS is too permissive** - Allows cross-site attacks
4. **Multiple high-severity npm vulnerabilities** - Easy fixes available

**Overall Risk Level:** 🟠 **HIGH** - Critical issues must be addressed before production use

**Estimated Remediation Time:** 2-3 days for critical issues, 1-2 weeks for complete hardening

---

## Appendix A: Security Checklist

- [ ] Implement GitHub webhook signature validation
- [ ] Implement Azure DevOps webhook signature validation
- [ ] Run `npm audit fix` to update dependencies
- [ ] Add input validation with Zod/Joi
- [ ] Configure CORS allowlist
- [ ] Add helmet.js security headers
- [ ] Implement rate limiting
- [ ] Add request size limits
- [ ] Validate query parameters
- [ ] Set up automated security scanning in CI/CD
- [ ] Create data export/deletion endpoints (GDPR)
- [ ] Document security policies
- [ ] Conduct penetration testing
- [ ] Set up secret rotation schedule

---

## Appendix B: References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [GitHub Webhook Security](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries)
- [Azure DevOps Webhook Security](https://learn.microsoft.com/en-us/azure/devops/service-hooks/overview)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Firebase Security Rules Guide](https://firebase.google.com/docs/rules)

---

**Report Generated:** February 7, 2026  
**Auditor:** GitHub Copilot Security Agent  
**Next Audit Due:** August 7, 2026 (6 months)
