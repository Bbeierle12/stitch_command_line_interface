# Backend Integration - Quick Start Guide

## What Has Been Implemented

### ✅ Frontend Services (43-55 hours completed)

1. **API Client (`src/services/apiClient.ts`)**
   - HTTP client with automatic retries
   - Timeout handling
   - Error parsing and handling
   - JWT token management

2. **Authentication Service (`src/services/authService.ts`)**
   - Login/logout functionality
   - Token storage and refresh
   - Auto token expiry monitoring
   - User profile management

3. **WebSocket Client (`src/services/wsClient.ts`)**
   - Real-time communication infrastructure
   - Auto-reconnection logic
   - Heartbeat mechanism
   - Message type routing

4. **Backend API Service (`src/services/backendApiService.ts`)**
   - Complete REST API integration
   - All endpoints defined per API spec
   - Type-safe API calls

5. **Command Execution Service (`src/services/commandExecutionService.ts`)**
   - Command validation
   - Dual execution (Electron + Backend)
   - Output streaming
   - History tracking

6. **LLM Integration Service (`src/services/llmService.ts`)**
   - OpenAI & Anthropic support
   - Code analysis
   - Context-aware explanations
   - Conversation management

7. **Electron IPC Updates**
   - Updated `electron/main.js` for command execution
   - Updated `electron/preload.js` for secure IPC
   - Updated type definitions

### 🏗️ Backend Server Starter (Ready to implement)

Created starter files in `backend/` directory:
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `.env.example` - Environment template
- `src/server.ts` - Server entry point
- `src/routes/auth.ts` - Example route
- `src/middleware/` - Error handler and rate limiter
- `src/utils/logger.ts` - Winston logger
- `src/websocket/server.ts` - WebSocket setup

## How to Use

### Step 1: Setup Frontend Environment

1. Copy the example environment file:
```powershell
cd react-dashboard
Copy-Item .env.example .env
```

2. Edit `.env` with your settings:
```env
VITE_API_BASE_URL=http://localhost:3001/v1
VITE_LLM_PROVIDER=openai
VITE_LLM_API_KEY=your_key_here
```

### Step 2: Setup Backend Server

1. Navigate to backend directory:
```powershell
cd backend
```

2. Install dependencies:
```powershell
npm install
```

3. Copy environment file:
```powershell
Copy-Item .env.example .env
```

4. Edit `.env` with your database and API keys

5. Implement the route files (see TODO comments in `src/server.ts`)

### Step 3: Implement Backend Routes

Each route file in `src/routes/` needs implementation. Example structure:

```typescript
// src/routes/ci.ts
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/status', async (req, res) => {
  // TODO: Implement CI status logic
  res.json({
    build: { durationMs: 4210, cacheHitPct: 82, status: 'pass' },
    tests: { pass: 162, fail: 3, skip: 4, flaky: 1 },
    logsRef: 'ci/main#1426'
  });
});

export default router;
```

### Step 4: Run Development Servers

Terminal 1 - Backend:
```powershell
cd backend
npm run dev
```

Terminal 2 - Frontend:
```powershell
cd react-dashboard
npm run dev
```

Terminal 3 - Electron (optional):
```powershell
cd react-dashboard
npm run electron:dev
```

### Step 5: Test Integration

1. Open browser to `http://localhost:5173`
2. Check browser console for API calls
3. Verify WebSocket connection
4. Test command execution
5. Try LLM features

## Integration Points

### Replace Mock Data Service

Update `src/services/dataService.ts`:

```typescript
import { backendApiService } from './backendApiService';

// Before (mock):
export function getCiState(): CiState {
  return { /* mock data */ };
}

// After (real API):
export async function getCiState(): Promise<CiState> {
  return await backendApiService.getCiState();
}
```

### Connect WebSocket

Update `src/App.tsx`:

```typescript
import { wsClient } from './services/wsClient';

useEffect(() => {
  // Connect WebSocket
  wsClient.connect();
  
  // Subscribe to log updates
  const unsubscribe = wsClient.on('log', (log) => {
    setConsoleLogs(prev => [...prev, log]);
  });
  
  return () => {
    unsubscribe();
    wsClient.disconnect();
  };
}, []);
```

### Initialize Auth

Update `src/main.tsx`:

```typescript
import { authService } from './services/authService';

// Initialize auth on app startup
authService.initialize();

// Listen for auth expiry
window.addEventListener('auth:expired', () => {
  // Show re-login modal
  console.log('Session expired, please login again');
});
```

## Testing

### Test API Client
```typescript
import { apiClient } from './services/apiClient';

// Set token
apiClient.setToken('your_jwt_token');

// Make request
const data = await apiClient.get('/ci/status');
```

### Test Command Execution
```typescript
import { commandExecutionService } from './services/commandExecutionService';

// Execute command
const result = await commandExecutionService.executeCommand('restart-dev');
console.log(result);
```

### Test LLM Service
```typescript
import { llmService } from './services/llmService';

// Get explanation
const response = await llmService.explainCiFailure('ci/main#1426', ['test1.ts']);
console.log(response.explanation);
```

## Next Steps

1. **Implement Backend Routes** (15-20 hours)
   - Create all route handlers
   - Connect to database
   - Implement business logic

2. **Add WebSocket Features** (8-10 hours)
   - Real-time log streaming
   - Live metric updates
   - Alert broadcasting

3. **Replace Frontend Mocks** (6-8 hours)
   - Update dataService
   - Add error handling
   - Implement loading states

4. **Add Testing** (10-12 hours)
   - Unit tests
   - Integration tests
   - E2E tests

5. **Documentation** (4-6 hours)
   - API reference
   - Setup guide
   - Deployment guide

## Troubleshooting

### Frontend can't connect to backend
- Check VITE_API_BASE_URL in `.env`
- Verify backend is running on correct port
- Check CORS configuration in backend

### WebSocket connection fails
- Verify WebSocket URL matches backend
- Check firewall/proxy settings
- Ensure authentication is working

### Command execution fails
- Check Electron IPC bridge is working
- Verify command whitelist in backend
- Check command timeout settings

### LLM requests fail
- Verify API keys are set correctly
- Check provider is available
- Review rate limits

## Documentation

See these files for more details:
- `BACKEND_INTEGRATION.md` - Complete integration guide
- `API_SPEC.md` - API endpoint specifications
- `ARCHITECTURE.md` - System architecture
- `backend/README.md` - Backend server documentation

## Support

For questions or issues:
1. Check the documentation
2. Review error logs
3. Check browser console
4. Review backend logs in `logs/app.log`
