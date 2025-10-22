# Live Preview Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Start the Backend

```bash
cd hacker_desktop_dashboard/backend
npm install
npm run dev
```

**What happens:**
- WebSocket server starts at `ws://localhost:3001/ws`
- File watcher monitors `backend/workspace/` directory
- REST API available at `http://localhost:3001/v1/preview`

**Verify it's running:**
```bash
curl http://localhost:3001/health
```

Should return: `{"status":"ok","timestamp":"...","uptime":...}`

---

### Step 2: Start the Frontend

```bash
cd hacker_desktop_dashboard/react-dashboard
npm install
npm run dev
```

**What happens:**
- Dashboard opens at `http://localhost:5173`
- WebSocket client auto-connects to backend
- Preview card subscribes to real-time events

**Verify it's running:**
- Open `http://localhost:5173` in your browser
- Look for the "Live Preview" card on the dashboard
- HMR indicator should show 🟢 "HMR stable"

---

### Step 3: Test File Watching

#### Option A: Create a test file

```bash
cd hacker_desktop_dashboard/backend/workspace
echo "console.log('Hello from Live Preview!');" > test.js
```

#### Option B: Edit an existing file

```bash
cd hacker_desktop_dashboard/backend/workspace
# Edit any file in your favorite editor
code src/App.tsx  # If using VS Code
```

**Expected behavior:**
1. Save the file (Ctrl+S / Cmd+S)
2. Within ~1.5 seconds:
   - HMR indicator shows 🟡 "HMR building"
   - Then switches to 🟢 "HMR stable"
   - Iframe reloads with updated content

---

## 🔍 Troubleshooting

### WebSocket not connecting

**Symptom:** Gray "(offline)" indicator

**Fix:**
1. Check backend is running: `curl http://localhost:3001/health`
2. Check browser console for WebSocket errors
3. Verify CORS settings in `backend/.env`

### Iframe not reloading

**Symptom:** HMR updates but preview stays the same

**Fix:**
1. Check dev server is actually running on `http://localhost:5173`
2. Open browser DevTools → Network tab → Verify iframe requests
3. Try manual reload: `POST http://localhost:3001/v1/preview/rebuild`

### File changes not detected

**Symptom:** Editing files doesn't trigger events

**Fix:**
1. Verify files are in `backend/workspace/` directory
2. Check backend logs for "File watcher started" message
3. Ensure files aren't in ignored patterns (`.gitignore`, `node_modules/`, etc.)

---

## 📝 Quick Reference

### WebSocket Events

**Listening on frontend:**
- `preview:update` → Iframe reloads
- `preview:build-start` → Yellow dot
- `preview:build-end` → Green dot
- `file:change` → File modified notification

**Sending from frontend:**
- `trigger-rebuild` → Force manual rebuild
- `subscribe` → Subscribe to event topics
- `ping` → Keepalive heartbeat

### API Endpoints

- `GET /v1/preview/state?mode=browser` → Get current preview state
- `POST /v1/preview/rebuild` → Trigger manual rebuild
- `GET /health` → Check backend health

### Environment Variables

Create `backend/.env`:
```env
PORT=3001
DEV_SERVER_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

---

## 🎯 Next Steps

### For Development

1. **Integrate with real Vite dev server:**
   - Hook into Vite's build events
   - Replace simulated rebuild with actual Vite HMR

2. **Add build output streaming:**
   - Stream compiler logs to CLI preview mode
   - Show real-time progress

3. **Error handling:**
   - Display build errors in overlay
   - Show compiler warnings

### For Production

1. **Container isolation:**
   - Run untrusted code in Docker containers
   - Set resource limits (CPU, memory, time)

2. **Security hardening:**
   - Reverse proxy for dev server
   - Strip unsafe headers
   - Rate limiting

3. **Monitoring:**
   - Track WebSocket connection health
   - Log rebuild frequency and duration
   - Alert on high CPU usage

---

## 📚 Documentation

- **Full Implementation Guide:** `LIVE_PREVIEW_IMPLEMENTATION.md`
- **Architecture Diagram:** `LIVE_PREVIEW_ARCHITECTURE.txt`
- **Summary:** `LIVE_PREVIEW_SUMMARY.md`

---

## 🆘 Need Help?

**Common Issues:**

| Issue | Solution |
|-------|----------|
| "Cannot connect to WebSocket" | Backend not running → `npm run dev` in `backend/` |
| "Iframe shows blank page" | Dev server not started → Check `DEV_SERVER_URL` |
| "No file changes detected" | Wrong directory → Use `backend/workspace/` |
| "TypeScript errors" | Dependencies not installed → `npm install` |

**Still stuck?** Check the troubleshooting section in `LIVE_PREVIEW_IMPLEMENTATION.md`

---

## ✅ Success Checklist

- [x] Backend running without errors
- [x] Frontend dashboard accessible
- [x] WebSocket connected (no "offline" indicator)
- [x] HMR indicator shows green dot
- [x] File changes trigger iframe reload
- [x] Build status updates in real-time

**All green?** You're ready to code with live preview! 🎉
