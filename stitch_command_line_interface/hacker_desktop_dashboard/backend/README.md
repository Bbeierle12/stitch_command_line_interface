# Backend Server Implementation

This is a Node.js/Express backend server for the Hacker Desktop Dashboard.

## Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Run development server
npm run dev

# Run production server
npm start
```

## Project Structure

```
backend/
├── src/
│   ├── server.ts              # Main entry point
│   ├── app.ts                 # Express app configuration
│   ├── config/                # Configuration files
│   ├── middleware/            # Express middleware
│   ├── routes/                # API routes
│   ├── controllers/           # Route controllers
│   ├── services/              # Business logic
│   ├── models/                # Database models
│   ├── websocket/             # WebSocket handlers
│   └── utils/                 # Utilities
├── tests/                     # Test files
├── package.json
├── tsconfig.json
└── .env.example
```

## API Endpoints

See [API_SPEC.md](../API_SPEC.md) for complete documentation.

### Authentication
- `POST /v1/auth/login` - Login
- `POST /v1/auth/logout` - Logout
- `POST /v1/auth/refresh` - Refresh token
- `GET /v1/auth/profile` - Get user profile

### CI/CD
- `GET /v1/ci/status` - Get CI status
- `GET /v1/ci/logs/:ref` - Get CI logs
- `POST /v1/ci/run` - Trigger CI run

### Commands
- `GET /v1/commands/list` - List available commands
- `POST /v1/commands/validate` - Validate command
- `POST /v1/commands/execute` - Execute command

### LLM
- `POST /v1/llm/explain` - Get explanation
- `POST /v1/llm/analyze-code` - Analyze code
- `POST /v1/llm/generate-code` - Generate code
- `POST /v1/llm/completions` - Get completions

### System
- `GET /v1/system/metrics` - Get system metrics

### Security
- `GET /v1/security/status` - Get security status
- `POST /v1/security/panic` - Emergency lockdown

### Network
- `GET /v1/network/flows` - Get network flows
- `POST /v1/network/flows/:id/block` - Block flow

### Logs
- `GET /v1/logs/stream` - Get console logs

### Notifications
- `GET /v1/notifications` - Get notifications
- `POST /v1/notifications/:id/read` - Mark as read

### Editor
- `GET /v1/editor/status` - Get editor status

### Snapshots
- `GET /v1/snapshots` - List snapshots
- `GET /v1/snapshots/:id` - Get snapshot data

### Health
- `GET /v1/health` - Health check

## WebSocket

Connect to `ws://localhost:3001/ws` for real-time updates.

### Message Types
- `ping` - Heartbeat
- `pong` - Heartbeat response
- `log` - Console log line
- `metric` - System metric update
- `alert` - Security alert
- `flow` - Network flow update

## Development

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+ (or your preferred database)
- Redis (optional, for caching)

### Environment Variables

See `.env.example` for all configuration options.

### Running Tests

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

### Database Migrations

```bash
# Run migrations
npm run migrate

# Rollback
npm run migrate:rollback

# Create new migration
npm run migrate:create migration_name
```

## Deployment

### Docker

```bash
# Build image
docker build -t cyberops-backend .

# Run container
docker run -p 3001:3001 --env-file .env cyberops-backend
```

### PM2

```bash
# Install PM2
npm install -g pm2

# Start server
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# Logs
pm2 logs
```

## Security

⚠️ **IMPORTANT:** This backend has been hardened with P0 security controls. See [P0_SECURITY_HARDENING.md](./P0_SECURITY_HARDENING.md) for complete details.

### Authentication & Authorization
- **JWT Required:** All endpoints except `/v1/auth/*` require valid JWT token
- **Role-Based Access:** 3 roles - viewer, developer, admin
- **Token Expiry:** Access tokens: 15 minutes, Refresh tokens: 7 days

### Default Users (Development Only)
```
admin / admin123      - Full access, user management
developer / dev123    - IDE operations, code execution
```
**⚠️ CHANGE THESE IN PRODUCTION!**

### API Security Controls
- **Global Rate Limiting:** 100 requests/minute per IP
- **Per-User Rate Limiting:** 10 code executions/minute per user
- **File Extension Whitelist:** Only safe extensions allowed (.js, .ts, .py, etc.)
- **Blocked Extensions:** .env, .sh, .bash, .ps1, .exe (security risk)
- **Concurrency Limits:** Max 5 simultaneous code executions
- **Resource Limits:** 30s timeout, 512MB memory, 10MB file size

### Code Execution Security
- Sandboxed execution via `isolated-vm`
- No access to `require()`, `process`, or filesystem
- Memory and CPU limits enforced
- Output size limits (1MB max)

### Audit Logging
All security-sensitive operations are logged:
- Authentication attempts (success/failure)
- Authorization denials
- File operations (create, delete, rename)
- Code executions
- Rate limit violations

### Quick Security Reference
See [SECURITY_QUICK_REFERENCE.md](./SECURITY_QUICK_REFERENCE.md) for:
- API testing examples
- Role access matrix
- Common troubleshooting
- Configuration guide

### Security Testing
```bash
# Run security test suite
npm test security.test.ts
npm test workspace-security.test.ts
npm test execution-security.test.ts
```

## Monitoring

- Logs: `logs/app.log`
- Metrics: Available at `/metrics` (Prometheus format)
- Health check: `GET /health`

## License

Private - Internal Use Only
