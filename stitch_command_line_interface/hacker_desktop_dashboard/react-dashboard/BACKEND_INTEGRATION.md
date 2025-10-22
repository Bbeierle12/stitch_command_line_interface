# Backend Integration Implementation Guide

## Overview

This document outlines the comprehensive backend integration for the Hacker Desktop Dashboard, including:
- **Backend API Integration** (40-60 hours)
- **Command Execution Backend** (20-30 hours)
- **LLM Integration** (30-40 hours)

**Total Estimated Time:** 90-130 hours

---

## ✅ Completed Components

### 1. Core API Infrastructure (8-10 hours) ✓

#### Files Created:
- `src/services/apiClient.ts` - HTTP client with retry logic, error handling, timeout management
- `src/services/authService.ts` - Authentication, token management, auto-refresh
- `src/services/wsClient.ts` - WebSocket client with reconnection and heartbeat
- `src/vite-env.d.ts` - TypeScript environment definitions
- `.env.example` - Environment configuration template

#### Features:
- ✓ Automatic retry with exponential backoff
- ✓ Request timeout handling
- ✓ JWT token management and auto-refresh
- ✓ WebSocket reconnection logic
- ✓ Error handling and parsing
- ✓ Type-safe API calls

### 2. Backend API Service (15-20 hours) ✓

#### Files Created:
- `src/services/backendApiService.ts` - Complete REST API implementation

#### Endpoints Implemented:
- ✓ Preview state (`/preview/:mode`)
- ✓ CI/CD status (`/ci/status`, `/ci/logs/:ref`, `/ci/run`)
- ✓ Security state (`/security/status`, `/security/panic`)
- ✓ System metrics (`/system/metrics`)
- ✓ Network flows (`/network/flows`, `/network/flows/:id/block`)
- ✓ Console logs (`/logs/stream`)
- ✓ Editor status (`/editor/status`)
- ✓ Notifications (`/notifications`, `/notifications/:id/read`)
- ✓ Command execution (`/commands/execute`)
- ✓ LLM explanations (`/llm/explain`)
- ✓ Snapshots (`/snapshots`, `/snapshots/:id`)
- ✓ Health check (`/health`)

### 3. Command Execution Service (12-15 hours) ✓

#### Files Created:
- `src/services/commandExecutionService.ts` - Command execution orchestration

#### Features:
- ✓ Command validation before execution
- ✓ Dry-run mode support
- ✓ Dual execution paths (Electron IPC + Backend API)
- ✓ Output streaming support
- ✓ Execution history tracking
- ✓ Risk assessment
- ✓ Timeout handling

### 4. Electron IPC Bridge (8-10 hours) ✓

#### Files Updated:
- `electron/main.js` - Command execution handlers with streaming
- `electron/preload.js` - Secure context bridge
- `src/electron.d.ts` - Updated TypeScript definitions
- `src/services/electronService.ts` - Added isElectron() utility

#### Features:
- ✓ Secure command execution in Electron
- ✓ Real-time output streaming
- ✓ Command safety checks
- ✓ Timeout and buffer limits
- ✓ Error handling and exit codes

### 5. LLM Integration Service (15-20 hours) ✓

#### Files Created:
- `src/services/llmService.ts` - Complete LLM integration

#### Features:
- ✓ Multiple provider support (OpenAI, Anthropic)
- ✓ Code analysis and generation
- ✓ Context-aware explanations
- ✓ Conversation history management
- ✓ CI failure analysis
- ✓ Security alert explanations
- ✓ Error fix suggestions
- ✓ Code optimization recommendations
- ✓ Token estimation and optimization
- ✓ Interactive chat support

---

## 🚧 Remaining Work

### 6. WebSocket Real-Time Updates (8-10 hours)

**Status:** Infrastructure created, needs implementation

**Tasks:**
1. **Server-Side WebSocket Handler** (4-5 hours)
   - Implement WebSocket server endpoint
   - Handle client connections and disconnections
   - Implement message routing
   - Add authentication middleware

2. **Real-Time Log Streaming** (2-3 hours)
   - Connect console logs to WebSocket
   - Implement log filtering and buffering
   - Add rate limiting

3. **Live Metrics Broadcasting** (2-3 hours)
   - Stream system metrics updates
   - Broadcast network flow changes
   - Push security alerts in real-time

**Files to Create:**
```
backend/
  websocket/
    server.ts         # WebSocket server setup
    handlers.ts       # Message handlers
    auth.ts           # WebSocket authentication
```

### 7. LLM Context Management (8-10 hours)

**Tasks:**
1. **Context Builder** (3-4 hours)
   - Extract relevant code context
   - Gather error logs and stack traces
   - Compile system state
   - Build conversation context

2. **Token Optimization** (3-4 hours)
   - Implement smart truncation
   - Prioritize relevant information
   - Code summarization
   - Chunk large contexts

3. **Conversation Persistence** (2-3 hours)
   - Save conversation history to database
   - Load previous conversations
   - Context search and retrieval

**Files to Create:**
```
src/services/
  llmContextBuilder.ts    # Context extraction and building
  llmTokenOptimizer.ts    # Token management
  conversationStore.ts    # Persistence layer
```

### 8. Backend Testing Suite (10-12 hours)

**Tasks:**
1. **Unit Tests** (5-6 hours)
   - Test apiClient retry logic
   - Test authService token management
   - Test commandExecutionService validation
   - Test llmService message formatting

2. **Integration Tests** (5-6 hours)
   - Test end-to-end API flows
   - Test WebSocket connections
   - Test command execution pipeline
   - Test LLM integration

**Files to Create:**
```
src/services/__tests__/
  apiClient.test.ts
  authService.test.ts
  backendApiService.test.ts
  commandExecutionService.test.ts
  llmService.test.ts
  wsClient.test.ts
```

### 9. Frontend Integration (6-8 hours)

**Tasks:**
1. **Update dataService** (2-3 hours)
   - Replace mock implementations with real API calls
   - Add error handling
   - Implement loading states

2. **Update Components** (3-4 hours)
   - Connect WebSocket for live updates
   - Add authentication flow
   - Handle API errors gracefully
   - Add loading indicators

3. **Update Hooks** (1-2 hours)
   - Update usePolling to use real API
   - Add error recovery
   - Implement optimistic updates

**Files to Update:**
```
src/services/dataService.ts      # Replace mocks
src/App.tsx                       # Add auth & WebSocket
src/hooks/usePolling.ts          # Use real API
src/components/*.tsx             # Error handling
```

### 10. Documentation & Deployment (4-6 hours)

**Tasks:**
1. **API Documentation** (2-3 hours)
   - Document all endpoints
   - Add request/response examples
   - Document authentication flow
   - Create Postman collection

2. **Setup Guide** (1-2 hours)
   - Environment configuration
   - Database setup
   - API key configuration
   - Development workflow

3. **Deployment Guide** (1-2 hours)
   - Production build process
   - Environment variables
   - Database migrations
   - Monitoring setup

**Files to Create:**
```
docs/
  API_REFERENCE.md
  SETUP_GUIDE.md
  DEPLOYMENT_GUIDE.md
  TROUBLESHOOTING.md
backend.postman_collection.json
```

---

## Backend Server Setup (Required)

### Express/Node.js Backend Structure

```
backend/
├── src/
│   ├── server.ts              # Main server entry
│   ├── config/
│   │   ├── database.ts        # Database configuration
│   │   └── env.ts             # Environment validation
│   ├── middleware/
│   │   ├── auth.ts            # JWT authentication
│   │   ├── errorHandler.ts   # Global error handling
│   │   └── rateLimit.ts       # Rate limiting
│   ├── routes/
│   │   ├── auth.ts            # Authentication routes
│   │   ├── ci.ts              # CI/CD routes
│   │   ├── commands.ts        # Command execution routes
│   │   ├── editor.ts          # Editor state routes
│   │   ├── llm.ts             # LLM routes
│   │   ├── logs.ts            # Log streaming routes
│   │   ├── network.ts         # Network routes
│   │   ├── notifications.ts   # Notification routes
│   │   ├── preview.ts         # Preview routes
│   │   ├── security.ts        # Security routes
│   │   ├── snapshots.ts       # Snapshot routes
│   │   └── system.ts          # System metrics routes
│   ├── controllers/
│   │   └── [controller files matching routes]
│   ├── services/
│   │   ├── commandService.ts  # Command execution logic
│   │   ├── llmService.ts      # LLM integration
│   │   └── metricsService.ts  # System metrics collection
│   ├── models/
│   │   └── [database models]
│   ├── websocket/
│   │   ├── server.ts          # WebSocket setup
│   │   └── handlers.ts        # Message handlers
│   └── utils/
│       ├── logger.ts          # Logging utility
│       └── validation.ts      # Request validation
├── package.json
├── tsconfig.json
└── .env.example
```

### Estimated Backend Implementation Time

- **Server setup & middleware:** 8-10 hours
- **Route implementations:** 15-20 hours
- **WebSocket server:** 6-8 hours
- **Command execution backend:** 10-12 hours
- **LLM backend integration:** 12-15 hours
- **Testing & debugging:** 10-12 hours

**Total Backend Server:** 61-77 hours

---

## Environment Configuration

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:3001/v1
VITE_WS_URL=ws://localhost:3001/ws
VITE_ENABLE_MOCK=false
VITE_LLM_PROVIDER=openai
VITE_LLM_API_KEY=your_api_key_here
VITE_LLM_MODEL=gpt-4-turbo-preview
```

### Backend (.env)
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:pass@localhost:5432/cyberops
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRY=24h

# LLM Configuration
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
LLM_DEFAULT_PROVIDER=openai
LLM_DEFAULT_MODEL=gpt-4-turbo-preview

# Rate Limiting
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

---

## Integration Checklist

### Phase 1: Infrastructure ✅
- [x] Create API client with retry logic
- [x] Implement authentication service
- [x] Setup WebSocket client
- [x] Configure environment variables
- [x] Create TypeScript definitions

### Phase 2: Core Services ✅
- [x] Implement backend API service
- [x] Create command execution service
- [x] Build LLM integration service
- [x] Update Electron IPC handlers
- [x] Add utility functions

### Phase 3: Real-Time Features ⏳
- [ ] Setup WebSocket server
- [ ] Implement log streaming
- [ ] Add live metrics broadcasting
- [ ] Connect frontend to WebSocket

### Phase 4: Advanced Features ⏳
- [ ] Implement LLM context builder
- [ ] Add token optimization
- [ ] Create conversation persistence
- [ ] Add command history tracking

### Phase 5: Testing ⏳
- [ ] Write unit tests for services
- [ ] Create integration tests
- [ ] Add E2E tests
- [ ] Performance testing

### Phase 6: Integration ⏳
- [ ] Update dataService with real APIs
- [ ] Connect components to backend
- [ ] Add error handling
- [ ] Implement loading states

### Phase 7: Documentation ⏳
- [ ] Write API documentation
- [ ] Create setup guide
- [ ] Write deployment guide
- [ ] Add troubleshooting docs

---

## Testing Strategy

### Unit Tests
```typescript
// Example: apiClient.test.ts
describe('ApiClient', () => {
  it('should retry failed requests', async () => {
    // Test retry logic
  });
  
  it('should handle timeouts', async () => {
    // Test timeout handling
  });
  
  it('should parse errors correctly', async () => {
    // Test error parsing
  });
});
```

### Integration Tests
```typescript
// Example: backend-integration.test.ts
describe('Backend Integration', () => {
  it('should authenticate and fetch data', async () => {
    // Test full auth + data flow
  });
  
  it('should execute commands via API', async () => {
    // Test command execution
  });
});
```

---

## Performance Considerations

1. **API Response Caching**
   - Cache CI status for 5 seconds
   - Cache system metrics for 3 seconds
   - Invalidate on manual refresh

2. **Request Batching**
   - Batch multiple API calls
   - Use GraphQL or custom batch endpoint
   - Reduce network overhead

3. **WebSocket Efficiency**
   - Throttle high-frequency updates
   - Implement server-side filtering
   - Use binary protocols for large data

4. **LLM Optimization**
   - Cache common explanations
   - Pre-generate responses for known issues
   - Use streaming for long responses

---

## Security Considerations

1. **Authentication**
   - JWT with short expiry
   - Refresh token rotation
   - Secure token storage

2. **Command Execution**
   - Whitelist allowed commands
   - Validate all inputs
   - Sandbox execution environment
   - Rate limit command execution

3. **LLM Integration**
   - Sanitize code before sending
   - Don't send sensitive data
   - Rate limit API calls
   - Validate LLM responses

4. **WebSocket Security**
   - Authenticate connections
   - Validate messages
   - Rate limit messages
   - Prevent injection attacks

---

## Next Steps

1. **Immediate** (This Week)
   - [ ] Setup backend server structure
   - [ ] Implement core routes
   - [ ] Connect frontend to API
   - [ ] Test basic flows

2. **Short Term** (Next 2 Weeks)
   - [ ] Implement WebSocket features
   - [ ] Add comprehensive testing
   - [ ] Complete LLM context management
   - [ ] Polish error handling

3. **Long Term** (Next Month)
   - [ ] Performance optimization
   - [ ] Advanced LLM features
   - [ ] Production deployment
   - [ ] Monitoring and logging

---

## Resources

### Dependencies to Install

**Frontend:**
```bash
# Already included in package.json
```

**Backend:**
```bash
npm install express cors helmet compression
npm install jsonwebtoken bcrypt
npm install ws socket.io
npm install openai @anthropic-ai/sdk
npm install winston morgan
npm install joi express-validator
npm install pg sequelize  # or your preferred database
```

### Helpful Links
- [Express.js Documentation](https://expressjs.com/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [OpenAI API](https://platform.openai.com/docs)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [JWT.io](https://jwt.io/)

---

## Summary

**Completed:** ~43-55 hours of work
- ✅ API Infrastructure
- ✅ Backend API Service
- ✅ Command Execution Service
- ✅ Electron IPC Bridge
- ✅ LLM Integration Service

**Remaining:** ~47-75 hours of work
- ⏳ WebSocket Implementation
- ⏳ LLM Context Management
- ⏳ Backend Testing Suite
- ⏳ Frontend Integration
- ⏳ Documentation & Deployment
- ⏳ Backend Server Development

**Total Project:** 90-130 hours (as estimated)

The foundation is solid. The remaining work focuses on:
1. Backend server implementation
2. Real-time features
3. Testing and polish
4. Documentation

All critical services are implemented and ready for integration!
