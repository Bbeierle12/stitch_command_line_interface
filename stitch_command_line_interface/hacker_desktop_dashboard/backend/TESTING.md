# Backend Testing Suite

Comprehensive test coverage for the CyberOps Dashboard backend API.

## Overview

The testing suite includes:
- **Unit Tests** - Individual service and function testing
- **Integration Tests** - API endpoint and route testing  
- **End-to-End Tests** - Complete workflow testing
- **WebSocket Tests** - Real-time communication testing
- **Middleware Tests** - Request handling and error processing

## Test Statistics

- **Total Test Files**: 6
- **Test Categories**: 5
- **Coverage Goal**: >70% lines, >60% branches/functions

## Running Tests

### All Tests
```bash
npm test
```

### With Coverage Report
```bash
npm run test:coverage
```

### Watch Mode (Development)
```bash
npm run test:watch
```

### Specific Test Suites

#### Unit Tests Only
```bash
npm run test:unit
```
Tests: LLM service, middleware

#### Integration Tests Only
```bash
npm run test:integration
```
Tests: All API routes, command execution

#### End-to-End Tests Only
```bash
npm run test:e2e
```
Tests: Complete workflows, multi-step interactions

#### WebSocket Tests Only
```bash
npm run test:ws
```
Tests: WebSocket connections, real-time messaging

#### All Tests with Verbose Output
```bash
npm run test:all
```

## Test Files

### 1. `llmService.test.ts` - LLM Service Unit Tests
**Coverage**: Context management, token optimization, multi-provider support

Tests:
- ✅ Context creation and management
- ✅ Message history tracking
- ✅ Token estimation and optimization
- ✅ Session management
- ✅ Context clearing and age calculation
- ✅ Concurrent session handling
- ✅ Context optimization
- ✅ Fallback behavior
- ✅ System message handling
- ✅ Error handling
- ✅ Options processing
- ✅ Conversation history

**Test Count**: 20+ tests

### 2. `commands.test.ts` - Command Execution Tests
**Coverage**: Command validation, dry-run, execution

Tests:
- ✅ Dry-run mode execution
- ✅ Command validation
- ✅ Unknown command handling
- ✅ Command arguments
- ✅ Execution modes
- ✅ Command listing
- ✅ Status checking
- ✅ Input sanitization
- ✅ Security validation
- ✅ Error handling
- ✅ Large payload handling

**Test Count**: 15+ tests

### 3. `routes.integration.test.ts` - Route Integration Tests
**Coverage**: All API endpoints with various scenarios

Tests:
- ✅ Health & status endpoints
- ✅ CI/CD routes
- ✅ Security routes
- ✅ System metrics routes
- ✅ Network routes
- ✅ Logs routes with pagination
- ✅ Preview routes with modes
- ✅ Editor routes
- ✅ Notifications routes
- ✅ LLM routes (all endpoints)
- ✅ Error handling (404, malformed JSON)
- ✅ CORS & headers
- ✅ Performance tests
- ✅ Concurrent request handling

**Test Count**: 50+ tests

### 4. `middleware.test.ts` - Middleware Tests
**Coverage**: Error handling, request processing, security

Tests:
- ✅ Custom error handler
- ✅ Async error handling
- ✅ Error structure validation
- ✅ JSON parse errors
- ✅ Rate limiting (basic)
- ✅ JSON body parsing
- ✅ URL-encoded body parsing
- ✅ Large payload handling
- ✅ Empty body handling
- ✅ Special character handling
- ✅ Content-Type handling
- ✅ Security headers

**Test Count**: 15+ tests

### 5. `e2e.test.ts` - End-to-End Workflow Tests
**Coverage**: Complete feature workflows

Tests:
- ✅ Complete CI/CD workflow (status → logs → LLM explain)
- ✅ Security monitoring (status → network flows → analysis)
- ✅ Development workflow (editor → preview → metrics → optimization)
- ✅ Code analysis workflow (analyze → generate → improve)
- ✅ Command execution workflow (validate → preview → execute → status)
- ✅ Multi-step LLM interaction with context
- ✅ Error recovery workflow
- ✅ Data consistency across requests
- ✅ Performance under load (20 concurrent requests)

**Test Count**: 10+ comprehensive workflows

### 6. `ws.test.ts` - WebSocket Tests
**Coverage**: Real-time communication

Tests:
- ✅ WebSocket connection
- ✅ Ping/pong heartbeat
- ✅ Message handling
- ✅ Connection lifecycle

**Test Count**: 5+ tests

### 7. `api.test.ts` - Basic API Tests
**Coverage**: Core API endpoints (existing)

Tests:
- ✅ Health check
- ✅ Basic endpoint functionality

**Test Count**: 8 tests

## Coverage Configuration

### Current Thresholds
```javascript
coverageThresholds: {
  global: {
    branches: 60,    // Branch coverage
    functions: 60,   // Function coverage
    lines: 70,       // Line coverage
    statements: 70,  // Statement coverage
  },
}
```

### Coverage Reports
Coverage reports are generated in multiple formats:
- **Text** - Console output
- **HTML** - `coverage/index.html` (open in browser)
- **LCOV** - `coverage/lcov.info` (for CI/CD)
- **JSON Summary** - `coverage/coverage-summary.json`

## Test Scenarios

### Security Testing
- Command injection prevention
- Input sanitization
- Error message sanitization
- Rate limiting (basic structure)

### Performance Testing
- Response time validation
- Concurrent request handling
- Large payload processing

### Error Handling
- Malformed JSON
- Missing required fields
- Invalid parameters
- Unknown routes
- Async error propagation

### Data Validation
- Type checking
- Structure validation
- Consistent responses
- Pagination limits

## Continuous Integration

### Pre-commit
```bash
npm run lint
npm run test:unit
```

### Pull Request
```bash
npm run test:all
npm run lint
```

### Main Branch
```bash
npm run test:coverage
# Ensure coverage thresholds are met
```

## Writing New Tests

### Unit Test Example
```typescript
describe('MyService', () => {
  it('should perform action correctly', async () => {
    const result = await myService.doSomething();
    expect(result).toBeDefined();
    expect(result.status).toBe('success');
  });
});
```

### Integration Test Example
```typescript
it('GET /v1/my-endpoint should return data', async () => {
  const res = await request(app).get('/v1/my-endpoint');
  
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('data');
});
```

### E2E Test Example
```typescript
it('should complete full workflow', async () => {
  // Step 1
  const step1 = await request(app).get('/v1/start');
  expect(step1.status).toBe(200);
  
  // Step 2
  const step2 = await request(app)
    .post('/v1/process')
    .send({ id: step1.body.id });
  expect(step2.status).toBe(200);
  
  // Step 3
  const step3 = await request(app).get(`/v1/result/${step1.body.id}`);
  expect(step3.status).toBe(200);
});
```

## Debugging Tests

### Run Single Test File
```bash
npx jest tests/llmService.test.ts
```

### Run Specific Test
```bash
npx jest -t "should create new context"
```

### Debug with Node Inspector
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Best Practices

1. **Isolation** - Each test should be independent
2. **Clear Names** - Test names should describe expected behavior
3. **AAA Pattern** - Arrange, Act, Assert
4. **Mock External Dependencies** - Database, external APIs, etc.
5. **Clean Up** - Reset state after each test
6. **Coverage Goals** - Aim for >70% line coverage, >60% branch coverage

## Test Data

Tests use mock data and do not require:
- External database
- External API keys (LLM service has fallback)
- External services

This ensures tests run quickly and reliably in any environment.

## Troubleshooting

### Tests Failing
1. Check dependencies: `npm install`
2. Check TypeScript compilation: `npm run build`
3. Run single test to isolate: `npx jest tests/specific.test.ts`

### Coverage Too Low
1. Identify uncovered lines: Check `coverage/index.html`
2. Add tests for uncovered branches
3. Test error paths and edge cases

### Tests Timeout
1. Increase timeout in jest.config.js
2. Check for hanging promises
3. Ensure async/await is used correctly

## Future Enhancements

- [ ] Add load testing with Artillery or k6
- [ ] Add database integration tests
- [ ] Add authentication/authorization tests
- [ ] Add snapshot testing for API responses
- [ ] Add mutation testing
- [ ] Add visual regression testing for error messages

---

**Total Test Coverage**: 120+ individual tests across 7 files

**Estimated Test Execution Time**: < 10 seconds for full suite
