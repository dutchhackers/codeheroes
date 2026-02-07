# Security Fixes Implementation Guide

This guide provides step-by-step instructions to fix the security vulnerabilities identified in the security audit.

---

## 1. Fix Webhook Signature Validation (CRITICAL)

### GitHub Webhook Validation

**File:** `libs/server/integrations/src/lib/providers/github/github.adapter.ts`

**Replace lines 89-100 with:**

```typescript
// Implement signature validation if secret is provided
if (secret && headers['x-hub-signature-256']) {
  const signature = headers['x-hub-signature-256'] as string;
  const payload = JSON.stringify(body);
  
  if (!this.verifyGitHubSignature(payload, signature, secret)) {
    return {
      isValid: false,
      error: 'Invalid webhook signature',
    };
  }
}
```

**Add this method to the GitHubAdapter class:**

```typescript
import crypto from 'crypto';

private verifyGitHubSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(digest)
    );
  } catch (error) {
    return false;
  }
}
```

**Update environment configuration:**

Add to `.env` file:
```
GITHUB_WEBHOOK_SECRET=your_webhook_secret_here
```

Configure in GitHub: Settings → Webhooks → Edit → Secret

---

### Azure DevOps Webhook Validation

**File:** `libs/server/integrations/src/lib/providers/azure-devops/adapter.ts`

**Replace lines 28-51 with:**

```typescript
validateWebhook(
  headers: Record<string, string | string[] | undefined>,
  body: any,
  secret?: string
): { isValid: boolean; error?: string; eventType?: string; eventId?: string } {
  const { eventType, id, notificationId } = body || {};
  
  if (!eventType) {
    return { isValid: false, error: 'Azure DevOps webhook missing eventType field' };
  }

  const eventIdentifier = id || notificationId?.toString();
  if (!eventIdentifier) {
    return { isValid: false, error: 'Azure DevOps webhook missing id/notificationId' };
  }

  // Validate HMAC signature if secret is provided
  if (secret && headers['x-vss-signature']) {
    const signature = headers['x-vss-signature'] as string;
    const payload = JSON.stringify(body);
    
    if (!this.verifyAzureSignature(payload, signature, secret)) {
      return { isValid: false, error: 'Invalid webhook signature' };
    }
  }

  return {
    isValid: true,
    eventType,
    eventId: eventIdentifier,
  };
}
```

**Add this method to the AzureDevOpsProviderAdapter class:**

```typescript
import crypto from 'crypto';

private verifyAzureSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(payload).digest('base64');
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(digest)
    );
  } catch (error) {
    return false;
  }
}
```

---

## 2. Update Vulnerable Dependencies

Run these commands:

```bash
# Fix non-breaking vulnerabilities
npm audit fix

# Review breaking changes
npm audit fix --force --dry-run

# Apply specific fixes
npm install quill@latest
npm update fast-xml-parser
npm update @isaacs/brace-expansion
```

**Important:** Test after each update to ensure no breaking changes.

---

## 3. Implement Input Validation

### Install Zod

```bash
npm install zod
```

### Example: Users Controller

**File:** `apps/api/src/controllers/users-controller.ts`

**Add schemas:**

```typescript
import { z } from 'zod';

const CreateUserSchema = z.object({
  uid: z.string().min(1),
  displayName: z.string().min(2).max(50),
  email: z.string().email(),
  photoUrl: z.string().url().optional(),
  userType: z.enum(['user', 'bot', 'system']).default('user'),
});

const UpdateUserSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  photoUrl: z.string().url().optional(),
});

const PaginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});
```

**Update controllers:**

```typescript
export const createUser = async (req: Request, res: Response) => {
  try {
    const validatedData = CreateUserSchema.parse(req.body);
    const user = await userService.createUser(validatedData);
    res.status(201).json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        error: 'Invalid input', 
        details: error.errors 
      });
      return;
    }
    logger.error('Error creating user', { error });
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const { limit, offset } = PaginationSchema.parse(req.query);
    const users = await userService.getAllUsers(limit, offset);
    res.json(users);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        error: 'Invalid query parameters', 
        details: error.errors 
      });
      return;
    }
    logger.error('Error fetching users', { error });
    res.status(500).json({ message: 'Internal server error' });
  }
};
```

---

## 4. Fix CORS Configuration

**File:** `apps/api/src/app.ts`

**Replace CORS configuration:**

```typescript
import cors from 'cors';

// Define allowed origins
const allowedOrigins = [
  process.env.FRONTEND_URL || 'https://codeheroes.app',
  process.env.ADMIN_URL || 'https://admin.codeheroes.app',
  ...(process.env.NODE_ENV === 'development' ? ['http://localhost:4200', 'http://localhost:4000'] : []),
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      callback(null, true);
      return;
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

**Update .env.example:**

```bash
# CORS Configuration
FRONTEND_URL=https://codeheroes.app
ADMIN_URL=https://admin.codeheroes.app
```

---

## 5. Add Security Headers (Helmet)

### Install Helmet

```bash
npm install helmet
```

### Configure Helmet

**File:** `apps/api/src/app.ts`

```typescript
import helmet from 'helmet';

// Add before other middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
}));

// Remove X-Powered-By (if not already done)
app.disable('x-powered-by');
```

---

## 6. Implement Rate Limiting

### Install express-rate-limit

```bash
npm install express-rate-limit
```

### Configure Rate Limiting

**File:** `apps/api/src/app.ts`

```typescript
import rateLimit from 'express-rate-limit';

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
});

// Stricter limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Apply to routes
app.use('/api/', apiLimiter);

// Note: If you have specific auth routes, apply authLimiter to them
// app.use('/api/auth/', authLimiter);
```

---

## 7. Add Request Size Limits

**File:** `apps/api/src/app.ts`

```typescript
import express from 'express';

// Limit request body size
app.use(express.json({ 
  limit: '1mb', // Adjust based on your needs
  strict: true, // Only accept arrays and objects
}));

app.use(express.urlencoded({ 
  extended: true,
  limit: '1mb',
}));
```

---

## 8. Update package.json Scripts

Add security-related scripts:

```json
{
  "scripts": {
    "security:audit": "npm audit",
    "security:audit:fix": "npm audit fix",
    "security:check": "npm audit --audit-level=moderate",
    "preinstall": "npm audit --audit-level=high || true"
  }
}
```

---

## 9. GitHub Actions Security Scanning

Create `.github/workflows/security-scan.yml`:

```yaml
name: Security Scan

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]
  schedule:
    - cron: '0 0 * * 1' # Weekly on Monday

jobs:
  security:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run npm audit
        run: npm audit --audit-level=moderate
        continue-on-error: true
        
      - name: Initialize CodeQL
        uses: github/codeql-action/init@v2
        with:
          languages: javascript, typescript
          
      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v2
```

---

## 10. Testing Security Fixes

### Test Webhook Signature Validation

**Test script:** `scripts/test-webhook-signature.ts`

```typescript
import crypto from 'crypto';

const secret = 'your-test-secret';
const payload = JSON.stringify({ test: 'data' });

// GitHub signature
const githubHmac = crypto.createHmac('sha256', secret);
const githubSignature = 'sha256=' + githubHmac.update(payload).digest('hex');
console.log('GitHub signature:', githubSignature);

// Azure signature
const azureHmac = crypto.createHmac('sha256', secret);
const azureSignature = azureHmac.update(payload).digest('base64');
console.log('Azure signature:', azureSignature);
```

### Test Input Validation

```typescript
// Test invalid inputs
const testCases = [
  { displayName: 'A' }, // Too short
  { displayName: 'A'.repeat(51) }, // Too long
  { email: 'invalid-email' }, // Invalid email
  { limit: 1000 }, // Exceeds max
];

for (const testCase of testCases) {
  try {
    CreateUserSchema.parse(testCase);
    console.log('❌ Should have failed:', testCase);
  } catch (error) {
    console.log('✅ Validation failed as expected:', testCase);
  }
}
```

### Test Rate Limiting

```bash
# Use Apache Bench or similar tool
ab -n 200 -c 10 http://localhost:3000/api/users

# Should see 429 (Too Many Requests) after 100 requests
```

---

## 11. Deployment Checklist

Before deploying to production:

- [ ] All critical vulnerabilities fixed
- [ ] Webhook signature validation implemented and tested
- [ ] Input validation added to all endpoints
- [ ] CORS properly configured with production domains
- [ ] Helmet security headers enabled
- [ ] Rate limiting configured
- [ ] Request size limits set
- [ ] Security scanning added to CI/CD
- [ ] Environment variables configured in production
- [ ] Webhook secrets configured in GitHub/Azure
- [ ] Security monitoring enabled
- [ ] Incident response plan documented

---

## 12. Monitoring and Maintenance

### Set up ongoing security monitoring:

1. **Dependabot:** Enable in GitHub Settings → Security → Dependabot
2. **npm audit:** Run weekly via cron job
3. **CodeQL:** Run on all PRs
4. **Log monitoring:** Monitor for:
   - Failed webhook validations
   - Rate limit violations
   - Authentication failures
   - Input validation errors

### Create alerts for:
- High/critical vulnerabilities in dependencies
- Suspicious authentication patterns
- Rate limit threshold breaches
- Failed webhook signature validations

---

## Support

For questions or issues implementing these fixes:
1. Check the main `SECURITY_AUDIT_REPORT.md`
2. Refer to official documentation links in the report
3. Open an issue in the repository

**Last Updated:** February 7, 2026
