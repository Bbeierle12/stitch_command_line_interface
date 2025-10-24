# P0 Security Hardening - Quick Reference

## 🎯 Changes at a Glance

### Global Authentication
```typescript
// ALL routes now require JWT (except /v1/auth/*)
app.use('/v1', authenticateToken, rateLimiter);
app.use('/api', authenticateToken, requireDeveloper, rateLimiter);
```

### Role-Based Access Matrix

| Endpoint | Viewer | Developer | Admin |
|----------|--------|-----------|-------|
| `GET /v1/*` | ✅ | ✅ | ✅ |
| `GET /api/workspace/*` | ❌ | ✅ | ✅ |
| `POST /api/workspace/files` | ❌ | ✅ | ✅ |
| `PUT /api/workspace/files` | ❌ | ✅ | ✅ |
| `DELETE /api/workspace/files` | ❌ | ❌ | ✅ |
| `POST /api/workspace/rename` | ❌ | ❌ | ✅ |
| `POST /api/execute` | ❌ | ✅ | ✅ |

### File Extension Security

**Allowed Extensions:**
```
.js .ts .jsx .tsx .json .html .css .scss
.py .java .cpp .c .h .rs .go .rb
.md .txt .yaml .yml .toml .xml .sql
```

**Blocked Extensions (Security Risk):**
```
.env .sh .bash .ps1 .exe .dll .bat .cmd
```

### Rate Limits

**Global (per IP):**
- Window: 60 seconds
- Max: 100 requests

**Code Execution (per user):**
- Window: 60 seconds
- Max: 10 requests

**Concurrency Limit:**
- Max simultaneous executions: 5

## 📋 Quick Testing

### Test Authentication
```bash
# Should fail (no token)
curl http://localhost:3001/v1/system

# Should succeed (with token)
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/v1/system
```

### Test Role Access
```bash
# Login as developer
TOKEN=$(curl -X POST http://localhost:3001/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"developer","password":"dev123"}' \
  | jq -r '.accessToken')

# Can execute code (developer role)
curl -X POST http://localhost:3001/api/execute \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"console.log(\"test\")","language":"javascript"}'

# Cannot delete files (requires admin)
curl -X DELETE http://localhost:3001/api/workspace/files/test.js \
  -H "Authorization: Bearer $TOKEN"
# Returns 403 Forbidden
```

### Test File Extension Restrictions
```bash
# Allowed
curl -X POST http://localhost:3001/api/workspace/files \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"path":"test.js","content":"console.log(\"ok\");"}'

# Blocked
curl -X POST http://localhost:3001/api/workspace/files \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"path":".env","content":"SECRET=123"}'
# Returns 500 with "File extension not allowed"
```

### Test Rate Limiting
```bash
# Execute 11 times rapidly (limit is 10/min)
for i in {1..11}; do
  curl -X POST http://localhost:3001/api/execute \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"code":"console.log('$i')","language":"javascript"}'
done
# 11th request returns 429 Rate Limit Exceeded
```

### Test Concurrency Limit
```bash
# Start 6 long-running executions (limit is 5)
for i in {1..6}; do
  curl -X POST http://localhost:3001/api/execute \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"code":"await new Promise(r => setTimeout(r, 5000))","language":"javascript"}' &
done
# 6th will fail with "Concurrent execution limit reached"
```

## 🐛 Common Issues

### "Authentication required"
- **Cause:** Missing or invalid JWT token
- **Fix:** Include `Authorization: Bearer <token>` header

### "Requires developer role or higher"
- **Cause:** User has viewer role
- **Fix:** Upgrade user role to developer or admin

### "File extension not allowed"
- **Cause:** Trying to create .env, .sh, .ps1, or other blocked file
- **Fix:** Use allowed extensions or manage these files outside the API

### "Concurrent execution limit reached"
- **Cause:** 5 or more executions already running
- **Fix:** Wait for executions to complete or increase limit via `MAX_CONCURRENT_EXECUTIONS`

### "Rate limit exceeded"
- **Cause:** Too many requests from user
- **Fix:** Wait for rate limit window to reset (check `retryAfter` in response)

## 🔧 Configuration

Create `.env` file:

```env
# Required for production
JWT_SECRET=your-super-secret-key-change-this
JWT_REFRESH_SECRET=your-refresh-secret-key-change-this

# Optional overrides
MAX_CONCURRENT_EXECUTIONS=5
MAX_EXECUTION_TIME_MS=30000
MAX_MEMORY_MB=512
MAX_FILE_SIZE_MB=10
RATE_LIMIT_MAX_REQUESTS=100
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
```

## 📊 Monitoring Endpoints

Check execution stats:
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/execute/stats
```

Response:
```json
{
  "success": true,
  "data": {
    "total": 42,
    "running": 2,
    "completed": 38,
    "failed": 2,
    "avgRuntime": 1250,
    "activeExecutions": 2,
    "maxConcurrent": 5
  }
}
```

## 🚨 Security Alerts

Monitor for these security events in logs:

- `Login failed` - Potential credential stuffing
- `Token verification failed` - Invalid/expired tokens
- `Requires admin role` - Unauthorized access attempts
- `File extension not allowed` - Attempts to upload malicious files
- `Rate limit exceeded` - Potential abuse
- `Concurrent execution limit reached` - Resource exhaustion attempts

## 📞 Support

For security issues or questions:
1. Check logs: `npm run logs`
2. Run tests: `npm test`
3. Review: `P0_SECURITY_HARDENING.md`

---

**Last Updated:** October 24, 2025  
**Version:** 1.0.0
