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

- All endpoints except `/auth/login` require JWT authentication
- Rate limiting: 100 requests/minute per IP
- Command execution is sandboxed and validated
- Sensitive data is encrypted at rest and in transit

## Monitoring

- Logs: `logs/app.log`
- Metrics: Available at `/metrics` (Prometheus format)
- Health check: `GET /health`

## License

Private - Internal Use Only
