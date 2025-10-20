# API Contract Specification

Backend endpoints required to replace mock `dataService`.

---

## Base URL
```
https://api.yourcompany.com/v1
```

All endpoints return JSON. Authentication via `Authorization: Bearer <token>` header.

---

## 1. Preview State

### `GET /preview/:mode`
Returns live preview configuration for specified mode.

**Path Parameters:**
- `mode`: `browser | cli | plots | tests | docs`

**Response:**
```json
{
  "mode": "browser",
  "url": "http://localhost:5173",
  "hmr": {
    "lastMs": 142,
    "ok": true
  }
}
```

**CLI mode response:**
```json
{
  "mode": "cli",
  "tail": {
    "lines": [
      "> npm run dev",
      "✅ Ready on http://localhost:5173"
    ],
    "since": "2025-10-20T14:32:00Z"
  },
  "hmr": { "lastMs": 198, "ok": true }
}
```

---

## 2. CI/CD State

### `GET /ci/status`
Current build and test metrics.

**Response:**
```json
{
  "build": {
    "durationMs": 4210,
    "cacheHitPct": 82,
    "status": "pass"
  },
  "tests": {
    "pass": 162,
    "fail": 3,
    "skip": 4,
    "flaky": 1,
    "lastRunAt": "2025-10-20T13:45:00Z"
  },
  "logsRef": "ci/main#1426"
}
```

**Status values:** `pass | fail | running`

### `GET /ci/logs/:ref`
Fetch detailed logs for a build.

**Response:**
```json
{
  "ref": "ci/main#1426",
  "logs": "...\nBuild completed\n...",
  "artifacts": [
    "https://cdn.company.com/artifacts/bundle.js"
  ]
}
```

---

## 3. Security State

### `GET /security/status`
VPN, firewall, encryption status + active alerts.

**Response:**
```json
{
  "vpn": "on",
  "firewall": "on",
  "encryption": "on",
  "alerts": [
    {
      "id": "alert-vpn-001",
      "sev": "low",
      "title": "VPN reconnected successfully",
      "ageSec": 120,
      "timestamp": "2025-10-20T14:28:00Z"
    },
    {
      "id": "alert-startup-002",
      "sev": "med",
      "title": "New launch agent detected",
      "ageSec": 450,
      "timestamp": "2025-10-20T14:22:00Z"
    }
  ],
  "startupDiff": {
    "added": ["com.unknown.agent"],
    "removed": []
  }
}
```

**Severity values:** `low | med | high`

### `POST /security/panic`
Execute emergency lockdown procedure.

**Request:**
```json
{
  "confirm": true,
  "reason": "Suspicious activity detected"
}
```

**Response:**
```json
{
  "success": true,
  "actions": [
    "Disconnected VPN",
    "Locked vault",
    "Cleared session logs"
  ]
}
```

---

## 4. System Metrics

### `GET /system/metrics`
Real-time hardware telemetry.

**Response:**
```json
{
  "cpu": {
    "usage": 43,
    "cores": 8,
    "temperature": 68
  },
  "memory": {
    "used": 12.4,
    "total": 16.0,
    "unit": "GB"
  },
  "battery": {
    "charging": true,
    "percentage": 89,
    "timeRemaining": null
  },
  "network": {
    "rx": 1024000,
    "tx": 512000,
    "unit": "bytes/sec"
  }
}
```

---

## 5. Network Flows

### `GET /network/flows`
Active connections with IDPS status.

**Response:**
```json
{
  "flows": [
    {
      "id": "flow-001",
      "app": "node",
      "dest": "api.internal:443",
      "status": "allow",
      "bytesTotal": 1048576,
      "startedAt": "2025-10-20T14:20:00Z"
    },
    {
      "id": "flow-002",
      "app": "chrome",
      "dest": "unknown-hub:8080",
      "status": "block",
      "bytesTotal": 0,
      "startedAt": "2025-10-20T14:30:00Z"
    }
  ]
}
```

**Status values:** `allow | watch | block`

### `POST /network/flows/:id/block`
Block a specific flow.

**Response:**
```json
{
  "success": true,
  "flowId": "flow-002",
  "blockedAt": "2025-10-20T14:31:00Z"
}
```

---

## 6. Console Logs

### `GET /logs/stream`
Recent log entries (last N lines).

**Query Parameters:**
- `limit`: Max lines (default 100)
- `since`: ISO 8601 timestamp

**Response:**
```json
{
  "logs": [
    {
      "id": 1,
      "tag": "INFO",
      "message": "Dev server ready on http://localhost:5173",
      "timestamp": "2025-10-20T13:57:03Z"
    },
    {
      "id": 2,
      "tag": "WARN",
      "message": "Three slow tests detected (>= 1200 ms)",
      "timestamp": "2025-10-20T13:57:41Z"
    }
  ]
}
```

**Tag values:** `INFO | WARN | ERROR | DEBUG`

### WebSocket: `wss://api.yourcompany.com/v1/logs/live`
Real-time log streaming.

**Message format:**
```json
{
  "id": 3,
  "tag": "ERROR",
  "message": "VPN heartbeat stalled, retrying",
  "timestamp": "2025-10-20T13:57:51Z"
}
```

---

## 7. Editor State

### `GET /editor/status`
Current file, branch, diagnostics.

**Response:**
```json
{
  "currentFile": "src/components/PreviewCard.tsx",
  "branch": "feature/live-preview",
  "diagnostics": {
    "error": 2,
    "warn": 5,
    "info": 12
  },
  "dirty": true,
  "recent": [
    { "file": "src/App.tsx", "delta": "2m" },
    { "file": "tailwind.config.js", "delta": "12m" }
  ]
}
```

---

## 8. Notifications

### `GET /notifications`
Inbox items bucketed by source.

**Response:**
```json
{
  "notifications": [
    {
      "id": "notif-001",
      "bucket": "CI",
      "text": "Pipeline main failed on lint stage",
      "severity": "high",
      "timestamp": "2025-10-20T14:10:00Z",
      "read": false
    },
    {
      "id": "notif-002",
      "bucket": "OS",
      "text": "Patch Tuesday bundle ready",
      "severity": "med",
      "timestamp": "2025-10-20T13:45:00Z",
      "read": false
    }
  ]
}
```

### `POST /notifications/:id/read`
Mark notification as read.

**Response:**
```json
{
  "success": true
}
```

---

## 9. Command Execution

### `POST /commands/execute`
Run command with optional dry-run.

**Request:**
```json
{
  "commandId": "restart-dev",
  "args": [],
  "dryRun": false
}
```

**Response (dry-run):**
```json
{
  "preview": "npm run dev",
  "risk": "low",
  "estimatedDuration": 2000
}
```

**Response (executed):**
```json
{
  "success": true,
  "output": "Dev server started on http://localhost:5173",
  "duration": 1847
}
```

---

## 10. LLM Explain

### `POST /llm/explain`
Request AI explanation for a context.

**Request:**
```json
{
  "context": "ci-failure",
  "data": {
    "logsRef": "ci/main#1426",
    "failedTests": ["test/auth.spec.ts"]
  }
}
```

**Response:**
```json
{
  "explanation": "The auth test is failing because the JWT secret was rotated. Update .env.test with the new key.",
  "suggestedActions": [
    { "id": "update-env", "label": "Update .env.test", "command": "echo 'JWT_SECRET=...' >> .env.test" }
  ]
}
```

---

## 11. Snapshots

### `GET /snapshots`
List available timeline snapshots.

**Response:**
```json
{
  "snapshots": [
    {
      "id": "snap-001",
      "timestamp": "2025-10-20T13:02:00Z",
      "label": "13:02"
    },
    {
      "id": "live",
      "timestamp": null,
      "label": "Live"
    }
  ]
}
```

### `GET /snapshots/:id`
Fetch state at specific snapshot.

**Response:** Returns all data contracts (CI, security, system, etc.) at that point in time.

---

## Error Handling

All endpoints return errors in this format:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token",
    "details": {}
  }
}
```

**Common codes:**
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `RATE_LIMIT_EXCEEDED` (429)
- `INTERNAL_ERROR` (500)

---

## Rate Limits

- Anonymous: 10 req/min
- Authenticated: 100 req/min
- WebSocket connections: 5 concurrent

Headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1697812800
```

---

## Authentication

### `POST /auth/login`
Obtain JWT token.

**Request:**
```json
{
  "username": "operator_7",
  "password": "***"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2025-10-20T18:00:00Z"
}
```

Use token in subsequent requests:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Implementation Notes

1. **Polling vs WebSocket:** Use WebSocket for logs/metrics; REST for on-demand queries.
2. **Caching:** Cache CI/security state for 5s server-side to reduce load.
3. **Pagination:** Add `?page=1&limit=50` for large result sets.
4. **Filtering:** Support `?status=fail&since=2025-10-20T00:00:00Z` on relevant endpoints.
5. **Versioning:** Use `/v1` prefix; increment for breaking changes.

---

## Testing Endpoints

Use this mock server during development:
```powershell
npm install -g json-server
json-server --watch db.json --port 3001
```

`db.json`:
```json
{
  "ci": { "build": {...}, "tests": {...} },
  "security": { "vpn": "on", ... },
  ...
}
```
