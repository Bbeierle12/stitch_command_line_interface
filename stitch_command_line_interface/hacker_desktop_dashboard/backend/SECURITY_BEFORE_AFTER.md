# Security Hardening - Before vs After

## Overview
This document shows the concrete changes made during P0 security hardening.

---

## 1. Authentication Enforcement

### Before
```typescript
// app.ts - NO authentication required
app.use('/v1', rateLimiter);
app.use('/v1/auth', authRoutes);
app.use('/v1/ci', ciRoutes);
app.use('/v1/commands', commandRoutes);
// ... all routes accessible without auth
app.use('/api', ideRoutes); // IDE routes unprotected
```

### After
```typescript
// app.ts - JWT required for ALL routes (except /v1/auth)
app.use('/v1/auth', rateLimiter, authJwtRoutes); // Public auth endpoints
app.use('/v1', authenticateToken, rateLimiter); // Protected /v1 routes
app.use('/api', authenticateToken, requireDeveloper, rateLimiter); // Protected /api routes
app.use('/v1/ci', ciRoutes);
app.use('/v1/commands', commandRoutes);
// ... all routes require valid JWT
app.use('/api', ideRoutes); // IDE routes require developer role
```

**Impact:** 🔒 All endpoints now require authentication and proper authorization

---

## 2. Login User Derivation

### Before (BUGGY)
```typescript
// auth-jwt.ts - WRONG: parsing JWT manually
router.post('/login', async (req, res) => {
  const tokens = await authService.login(username, password);
  const user = authService.getUserById(tokens.accessToken.split('.')[1]); // BUG!
  return res.json({ success: true, ...tokens, user });
});
```

### After (FIXED)
```typescript
// auth-jwt.ts - CORRECT: using proper token verification
router.post('/login', async (req, res) => {
  const tokens = await authService.login(username, password);
  const payload = authService.verifyToken(tokens.accessToken);
  const user = authService.getUserById(payload.userId);
  return res.json({ success: true, ...tokens, user });
});
```

**Impact:** ✅ Correct user data returned, prevents authentication bypass

---

## 3. Workspace File Operations

### Before
```typescript
// ide.ts - NO role checks, anyone can delete/rename
router.delete('/workspace/files/:path(*)', async (req, res) => {
  await workspaceService.deleteFile(req.params.path);
  return res.json({ success: true });
});

router.post('/workspace/rename', async (req, res) => {
  await workspaceService.rename(oldPath, newPath);
  return res.json({ success: true });
});
```

### After
```typescript
// ide.ts - Admin-only for destructive operations
router.delete('/workspace/files/:path(*)', requireAdmin, async (req, res) => {
  await workspaceService.deleteFile(req.params.path);
  logger.info(`File deleted by ${req.user?.username}: ${req.params.path}`);
  return res.json({ success: true });
});

router.post('/workspace/rename', requireAdmin, async (req, res) => {
  await workspaceService.rename(oldPath, newPath);
  logger.info(`Renamed by ${req.user?.username}: ${oldPath} -> ${newPath}`);
  return res.json({ success: true });
});
```

**Impact:** 🛡️ Only admins can delete/rename files, all operations audited

---

## 4. File Extension Security

### Before
```typescript
// workspaceService.ts - DANGEROUS: allows .env and shell scripts
this.allowedExtensions = new Set([
  '.js', '.ts', '.jsx', '.tsx', '.json', '.html', '.css', '.scss',
  '.py', '.java', '.cpp', '.c', '.h', '.rs', '.go', '.rb',
  '.md', '.txt', '.yaml', '.yml', '.toml', '.xml',
  '.sh', '.bash', '.ps1', '.sql', '.env' // ⚠️ SECURITY RISK
]);
```

### After
```typescript
// workspaceService.ts - SAFE: blocks dangerous extensions
this.allowedExtensions = new Set([
  '.js', '.ts', '.jsx', '.tsx', '.json', '.html', '.css', '.scss',
  '.py', '.java', '.cpp', '.c', '.h', '.rs', '.go', '.rb',
  '.md', '.txt', '.yaml', '.yml', '.toml', '.xml', '.sql'
  // ✅ Removed: .sh, .bash, .ps1, .env
]);

this.excludePatterns = [
  'node_modules', '.git', 'dist', 'build', 'coverage',
  '.env.local', '.env', '.DS_Store', 'thumbs.db', // ✅ Added .env
];
```

**Impact:** 🚫 Prevents creation of shell scripts and environment files

---

## 5. File Watcher Ignore Patterns

### Before (BROKEN)
```typescript
// fileWatcherService.ts - Ignores ALL workspace events
this.watcher = chokidar.watch(this.workspacePath, {
  ignored: [
    '**/node_modules/**',
    '**/dist/**',
    '**/.git/**',
    '**/workspace/**', // ❌ BUG: suppresses all events
  ],
});
```

### After (FIXED)
```typescript
// fileWatcherService.ts - Watches workspace, ignores specific patterns
this.watcher = chokidar.watch(this.workspacePath, {
  ignored: [
    '**/node_modules/**',
    '**/dist/**',
    '**/.git/**',
    '**/.env',
    '**/.env.local',
    // ✅ Removed: **/workspace/**
  ],
});
```

**Impact:** 👀 File watcher now properly detects workspace changes

---

## 6. Code Execution Security

### Before
```typescript
// ide.ts - NO rate limiting, NO concurrency control
router.post('/execute', async (req, res) => {
  const executionId = await executionService.executeCode({
    code, language, timeout, memoryLimit,
  });
  // ... unlimited executions possible
});

// executionService.ts - NO concurrency limit
export class ExecutionService extends EventEmitter {
  async executeCode(options: ExecutionOptions): Promise<string> {
    const id = this.generateExecutionId(options.code);
    // ... no check for concurrent executions
  }
}
```

### After
```typescript
// ide.ts - Per-user rate limiting (10/min)
router.post('/execute', requireDeveloper, userRateLimit(10, 60000), async (req, res) => {
  logger.info(`Code execution requested by ${req.user?.username} (${language})`);
  const executionId = await executionService.executeCode({
    code, language, timeout, memoryLimit,
  });
});

// executionService.ts - Concurrency cap (max 5 concurrent)
export class ExecutionService extends EventEmitter {
  private readonly MAX_CONCURRENT_EXECUTIONS: number;
  private activeExecutions: number = 0;

  async executeCode(options: ExecutionOptions): Promise<string> {
    if (this.activeExecutions >= this.MAX_CONCURRENT_EXECUTIONS) {
      throw new Error(`Concurrent execution limit reached (${this.MAX_CONCURRENT_EXECUTIONS})`);
    }
    
    this.activeExecutions++;
    try {
      // ... execute code
    } finally {
      this.activeExecutions--;
    }
  }
}
```

**Impact:** ⚡ Prevents DoS via execution spam, enforces resource limits

---

## 7. Security Testing

### Before
```
tests/
  ├── api.test.ts
  ├── commands.test.ts
  ├── e2e.test.ts
  └── llmService.test.ts
  
❌ NO security-focused tests
```

### After
```
tests/
  ├── api.test.ts
  ├── commands.test.ts
  ├── e2e.test.ts
  ├── llmService.test.ts
  ├── security.test.ts               # ✅ Auth & authorization tests
  ├── workspace-security.test.ts     # ✅ File extension & path tests
  └── execution-security.test.ts     # ✅ Concurrency & resource tests
```

**Impact:** ✅ Automated validation of all security controls

---

## Summary of Security Improvements

| Category | Before | After | Risk Reduction |
|----------|--------|-------|----------------|
| **Authentication** | None | JWT required | 🔴 Critical → 🟢 Secure |
| **Authorization** | None | Role-based (viewer/dev/admin) | 🔴 Critical → 🟢 Secure |
| **Rate Limiting** | Global only | Global + per-user | 🟡 Medium → 🟢 Secure |
| **File Extensions** | All allowed | Whitelist only | 🔴 Critical → 🟢 Secure |
| **Shell Scripts** | Allowed | Blocked | 🔴 Critical → 🟢 Secure |
| **.env Files** | Allowed | Blocked | 🔴 Critical → 🟢 Secure |
| **File Watcher** | Broken | Working | 🟡 Medium → 🟢 Secure |
| **Execution Limits** | None | Concurrency cap | 🔴 Critical → 🟢 Secure |
| **Audit Logging** | Partial | Comprehensive | 🟡 Medium → 🟢 Secure |
| **Test Coverage** | None | Comprehensive | 🔴 Critical → 🟢 Secure |

---

## Migration Guide for Existing Clients

### Step 1: Obtain JWT Token
```typescript
// Before: Direct API access
fetch('http://localhost:3001/v1/system')

// After: Login first, then use token
const { accessToken } = await fetch('http://localhost:3001/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'developer', password: 'dev123' })
}).then(r => r.json());

fetch('http://localhost:3001/v1/system', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});
```

### Step 2: Handle Role Requirements
```typescript
// Developers can execute code
await fetch('/api/execute', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${devToken}` },
  body: JSON.stringify({ code: '...', language: 'javascript' })
});

// Only admins can delete files
await fetch('/api/workspace/files/test.js', {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${adminToken}` }
});
```

### Step 3: Handle Rate Limits
```typescript
// Catch 429 responses and retry
try {
  await executeCode(code);
} catch (error) {
  if (error.status === 429) {
    const retryAfter = error.retryAfter; // seconds
    console.log(`Rate limited. Retry after ${retryAfter}s`);
    await sleep(retryAfter * 1000);
    await executeCode(code); // Retry
  }
}
```

### Step 4: Avoid Blocked Extensions
```typescript
// Before: Could create any file
await createFile('.env', 'SECRET=123');        // ✅ Worked
await createFile('deploy.sh', '#!/bin/bash'); // ✅ Worked

// After: Only allowed extensions
await createFile('config.json', '{"key":"val"}'); // ✅ Works
await createFile('.env', 'SECRET=123');           // ❌ Blocked
await createFile('deploy.sh', '#!/bin/bash');    // ❌ Blocked
```

---

**Document Version:** 1.0.0  
**Last Updated:** October 24, 2025  
**Status:** ✅ All changes implemented and tested
