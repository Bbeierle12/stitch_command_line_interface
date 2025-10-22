# Integration Guide - Advanced Features

## Quick Start: Integrate Advanced Features

This guide shows how to wire up the newly implemented authentication, multi-language execution, Git integration, debugger, and deployment features into the existing Live Coding IDE.

---

## 1. Register Routes in `app.ts`

**File:** `backend/src/app.ts`

Add the new routes alongside existing IDE routes:

```typescript
import authRoutes from './routes/auth-jwt';
import gitRoutes from './routes/git';

// After existing route imports...

// Authentication routes (no auth required for these endpoints)
app.use('/api/auth', authRoutes);

// Protected routes (require authentication)
app.use('/api/git', authenticateToken, gitRoutes);
```

---

## 2. Protect Existing IDE Routes

Update `backend/src/app.ts` to add authentication to IDE endpoints:

```typescript
import { authenticateToken, requireRole } from './middleware/auth';

// Protect workspace routes - require developer role
app.use('/api/workspace', authenticateToken, requireRole('developer'), ideRoutes);

// Protect execution routes - require developer role  
app.use('/api/execute', authenticateToken, requireRole('developer'), ideRoutes);

// Protect AI routes - optional authentication (works better when logged in)
app.use('/api/ai', optionalAuth, ideRoutes);
```

---

## 3. Add Multi-Language Execution Endpoint

**File:** `backend/src/routes/ide.ts`

Add new endpoint for multi-language execution:

```typescript
import { multiLangExecutionService } from '../services/multiLangExecutionService';

/**
 * POST /api/execute/multi-lang
 * Execute code in various languages via Docker
 */
router.post('/execute/multi-lang', async (req, res) => {
  try {
    const { language, code, timeout } = req.body;
    
    if (!language || !code) {
      return res.status(400).json({ 
        success: false, 
        error: 'Language and code required' 
      });
    }

    const result = await multiLangExecutionService.executeInDocker(
      language,
      code,
      { timeout: timeout || 30000 }
    );

    res.json({ 
      success: true, 
      data: {
        output: result.output,
        exitCode: result.exitCode,
        executionTime: result.executionTime
      }
    });
  } catch (error) {
    logger.error('Multi-language execution failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Execution failed' 
    });
  }
});
```

---

## 4. Add Debugger Routes

**File:** `backend/src/routes/debug.ts` (new file)

```typescript
import { Router } from 'express';
import { debuggerService } from '../services/debuggerService';
import { logger } from '../utils/logger';

const router = Router();

// Start debugging
router.post('/start', async (req, res) => {
  try {
    const { file, args } = req.body;
    await debuggerService.startDebugging(file, args);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Stop debugging
router.post('/stop', async (req, res) => {
  try {
    await debuggerService.stopDebugging();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add breakpoint
router.post('/breakpoint', async (req, res) => {
  try {
    const { file, line, condition } = req.body;
    const bp = debuggerService.addBreakpoint(file, line, condition);
    res.json({ success: true, data: bp });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Control execution
router.post('/continue', (req, res) => {
  debuggerService.continue();
  res.json({ success: true });
});

router.post('/step-over', (req, res) => {
  debuggerService.stepOver();
  res.json({ success: true });
});

router.post('/step-into', (req, res) => {
  debuggerService.stepInto();
  res.json({ success: true });
});

router.post('/step-out', (req, res) => {
  debuggerService.stepOut();
  res.json({ success: true });
});

// Get state
router.get('/state', (req, res) => {
  const state = debuggerService.getState();
  res.json({ success: true, data: state });
});

export default router;
```

Then register in `app.ts`:
```typescript
import debugRoutes from './routes/debug';
app.use('/api/debug', authenticateToken, requireRole('developer'), debugRoutes);
```

---

## 5. Add Deployment Routes

**File:** `backend/src/routes/deploy.ts` (new file)

```typescript
import { Router } from 'express';
import { deploymentService } from '../services/deploymentService';

const router = Router();

// Deploy
router.post('/', async (req, res) => {
  try {
    const config = req.body;
    const deployment = await deploymentService.deploy(config);
    res.json({ success: true, data: deployment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Quick deploy to Docker
router.post('/docker', async (req, res) => {
  try {
    const { environment } = req.body;
    const deployment = await deploymentService.quickDeployDocker(environment);
    res.json({ success: true, data: deployment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Quick deploy to Vercel
router.post('/vercel', async (req, res) => {
  try {
    const { environment } = req.body;
    const deployment = await deploymentService.quickDeployVercel(environment);
    res.json({ success: true, data: deployment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get deployment status
router.get('/:id', (req, res) => {
  const deployment = deploymentService.getDeployment(req.params.id);
  if (!deployment) {
    return res.status(404).json({ success: false, error: 'Deployment not found' });
  }
  res.json({ success: true, data: deployment });
});

// List deployments
router.get('/', (req, res) => {
  const deployments = deploymentService.listDeployments();
  res.json({ success: true, data: deployments });
});

export default router;
```

Then register in `app.ts`:
```typescript
import deployRoutes from './routes/deploy';
app.use('/api/deploy', authenticateToken, requireRole('admin'), deployRoutes);
```

---

## 6. Update WebSocket Handler for New Features

**File:** `backend/src/websocket/ideHandler.ts`

Add event handlers for debugger and deployment:

```typescript
import { debuggerService } from '../services/debuggerService';
import { deploymentService } from '../services/deploymentService';

// Inside setupIDEWebSocket function:

// Debugger events
socket.on('debug:start', async (data) => {
  try {
    await debuggerService.startDebugging(data.file, data.args);
  } catch (error) {
    socket.emit('debug:error', { error: error.message });
  }
});

socket.on('debug:breakpoint', (data) => {
  const bp = debuggerService.addBreakpoint(data.file, data.line, data.condition);
  socket.emit('debug:breakpoint-added', bp);
});

socket.on('debug:continue', () => {
  debuggerService.continue();
});

// Forward debugger events to socket
debuggerService.on('paused', (data) => {
  socket.emit('debug:paused', data);
});

debuggerService.on('resumed', () => {
  socket.emit('debug:resumed');
});

// Deployment events
socket.on('deploy:start', async (config) => {
  try {
    const deployment = await deploymentService.deploy(config);
    socket.emit('deploy:started', deployment);
  } catch (error) {
    socket.emit('deploy:error', { error: error.message });
  }
});

// Forward deployment logs to socket
deploymentService.on('deployment:log', ({ id, log }) => {
  socket.emit('deploy:log', { id, log });
});

deploymentService.on('deployment:success', (deployment) => {
  socket.emit('deploy:success', deployment);
});

deploymentService.on('deployment:failed', (deployment) => {
  socket.emit('deploy:failed', deployment);
});
```

---

## 7. Update Frontend - Add Language Selector

**File:** `react-dashboard/src/components/LiveIDE.tsx`

Add language selection to the IDE:

```typescript
const [selectedLanguage, setSelectedLanguage] = useState<string>('javascript');

const languages = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
];

// Update runCode function
const runCode = async () => {
  if (!currentFile || !code) return;
  
  setExecuting(true);
  setOutput('Running...\n');

  try {
    if (selectedLanguage === 'javascript') {
      // Use existing JavaScript execution
      socket.emit('code:execute', { code, file: currentFile });
    } else {
      // Use multi-language execution
      const response = await fetch('http://localhost:3001/api/execute/multi-lang', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          language: selectedLanguage,
          code,
        }),
      });
      
      const result = await response.json();
      if (result.success) {
        setOutput(result.data.output);
      } else {
        setOutput(`Error: ${result.error}`);
      }
    }
  } catch (error) {
    setOutput(`Error: ${error.message}`);
  } finally {
    setExecuting(false);
  }
};

// Add language selector to UI
<select 
  value={selectedLanguage} 
  onChange={(e) => setSelectedLanguage(e.target.value)}
  className="px-3 py-1 bg-gray-700 rounded"
>
  {languages.map(lang => (
    <option key={lang.value} value={lang.value}>{lang.label}</option>
  ))}
</select>
```

---

## 8. Add Authentication to Frontend

**File:** `react-dashboard/src/components/Login.tsx` (new file)

```typescript
import React, { useState } from 'react';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    
    const data = await response.json();
    if (data.success) {
      localStorage.setItem('token', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      window.location.href = '/ide';
    } else {
      alert('Login failed: ' + data.error);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold mb-6 text-cyan-400">Login</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-2 mb-4 bg-gray-700 rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 mb-6 bg-gray-700 rounded"
        />
        <button
          onClick={handleLogin}
          className="w-full px-4 py-2 bg-cyan-500 rounded hover:bg-cyan-600"
        >
          Login
        </button>
        <p className="text-sm text-gray-400 mt-4">
          Default: admin / admin123 or developer / dev123
        </p>
      </div>
    </div>
  );
};
```

---

## 9. Environment Variables

Create `.env` file in `backend/` directory:

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=3001
NODE_ENV=development

# Database (for production)
# DATABASE_URL=postgresql://user:password@localhost:5432/live_ide

# Docker (for multi-language execution)
DOCKER_HOST=unix:///var/run/docker.sock

# Git Configuration
GIT_DEFAULT_BRANCH=main

# Deployment
VERCEL_TOKEN=your-vercel-token
NETLIFY_TOKEN=your-netlify-token
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
```

---

## 10. Testing the Integration

### Test Authentication
```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Save the token from response, then use it:
export TOKEN="your-jwt-token-here"

# Test protected endpoint
curl http://localhost:3001/api/workspace/files \
  -H "Authorization: Bearer $TOKEN"
```

### Test Multi-Language Execution
```bash
# Python
curl -X POST http://localhost:3001/api/execute/multi-lang \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"language": "python", "code": "print(\"Hello from Python!\")"}'

# Java
curl -X POST http://localhost:3001/api/execute/multi-lang \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"language": "java", "code": "class Main { public static void main(String[] args) { System.out.println(\"Hello from Java!\"); } }"}'
```

### Test Git Operations
```bash
# Get status
curl http://localhost:3001/api/git/status \
  -H "Authorization: Bearer $TOKEN"

# Commit
curl -X POST http://localhost:3001/api/git/commit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message": "Test commit", "author": {"name": "Dev", "email": "dev@test.com"}}'
```

### Test Deployment
```bash
# Quick deploy to Docker
curl -X POST http://localhost:3001/api/deploy/docker \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"environment": "development"}'
```

---

## Summary

✅ **Authentication:** Routes protected, JWT tokens required  
✅ **Multi-Language:** Docker-based execution for 7 languages  
✅ **Git Integration:** Full Git workflow via REST API  
✅ **Debugger:** Breakpoints, stepping, variable inspection  
✅ **Deployment:** Automated deployment to 5+ platforms  

**Next:** Wire these features into your frontend UI for a complete enterprise-grade Live Coding IDE!
