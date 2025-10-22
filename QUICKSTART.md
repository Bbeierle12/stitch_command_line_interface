# 🚀 Quick Start Guide - SecureCode IDE

## Get Running in 5 Minutes

### Step 1: Start the Backend (2 minutes)

```powershell
# Navigate to backend
cd stitch_command_line_interface\hacker_desktop_dashboard\backend

# Start the server
npm run dev
```

**You should see:**
```
🚀 Server running at http://localhost:3001
📡 WebSocket server running at ws://localhost:3001/ws
🔌 Socket.IO server running at http://localhost:3001/socket.io
```

### Step 2: Test the Backend (1 minute)

Open a new PowerShell window:

```powershell
# Test health endpoint
curl http://localhost:3001/health

# Create your first file
$file = @{
    path = "src/hello.js"
    content = "console.log('Hello from SecureCode IDE!');\nconsole.log('2 + 2 =', 2 + 2);"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:3001/api/workspace/files -Method POST -Body $file -ContentType "application/json"

# Execute code
$code = @{
    code = "console.log('Testing execution...');\nconst numbers = [1, 2, 3, 4, 5];\nconst sum = numbers.reduce((a, b) => a + b, 0);\nconsole.log('Sum:', sum);"
    language = "javascript"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:3001/api/execute -Method POST -Body $code -ContentType "application/json"
```

**Expected:** You'll see JSON responses with your code output!

### Step 3: Use the Frontend IDE (2 minutes)

Update `react-dashboard/src/App.tsx`:

```typescript
import { LiveIDE } from './components/LiveIDE';
import './index.css';

function App() {
  return <LiveIDE />;
}

export default App;
```

Start the frontend:

```powershell
cd ..\react-dashboard
npm run dev
```

Open http://localhost:5173 in your browser - **you'll see the full IDE!**

---

## ✨ What You Can Do Now

### 1. Edit Code
- Click on files in the left sidebar
- Edit in Monaco Editor (center)
- See syntax highlighting, autocomplete

### 2. Run Code
- Click **▶ Run** button
- Watch output stream in terminal (right)
- See execution time

### 3. AI Assistant
- Select code
- Click **🤖 Explain** for explanations
- Click **🧪 Tests** to generate tests
- Click **♻️ Refactor** for improvements

### 4. Manage Files
- Create new files via API
- Navigate folder structure
- Search workspace

---

## 🎯 Example Workflows

### Workflow 1: Create and Run a File

```powershell
# Create file
$file = @{
    path = "src/factorial.js"
    content = @"
function factorial(n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

console.log('5! =', factorial(5));
console.log('10! =', factorial(10));
"@
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:3001/api/workspace/files -Method POST -Body $file -ContentType "application/json"

# Execute it
$code = @{
    code = (Get-Content ".\workspace\src\factorial.js" -Raw)
    language = "javascript"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:3001/api/execute -Method POST -Body $code -ContentType "application/json"
```

### Workflow 2: AI Code Explanation

```powershell
$explain = @{
    code = @"
const fibonacci = (n, memo = {}) => {
    if (n in memo) return memo[n];
    if (n <= 2) return 1;
    memo[n] = fibonacci(n - 1, memo) + fibonacci(n - 2, memo);
    return memo[n];
};
"@
    language = "javascript"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:3001/api/ai/explain -Method POST -Body $explain -ContentType "application/json"
```

### Workflow 3: Generate Tests

```powershell
$test = @{
    code = "function add(a, b) { return a + b; }"
    language = "javascript"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:3001/api/ai/test -Method POST -Body $test -ContentType "application/json"
```

---

## 🔧 Configuration

Create `backend/.env`:

```env
# Server
PORT=3001
NODE_ENV=development

# Workspace
WORKSPACE_ROOT=./workspace

# Execution Limits
MAX_EXECUTION_TIME_MS=30000
MAX_MEMORY_MB=512
MAX_OUTPUT_SIZE_KB=1024

# CORS
CORS_ORIGIN=http://localhost:5173
CORS_CREDENTIALS=true

# AI (Optional)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
```

---

## 🎨 Features Showcase

### Monaco Editor
- ✅ Syntax highlighting
- ✅ IntelliSense autocomplete
- ✅ Multi-cursor editing
- ✅ Find/replace
- ✅ Minimap

### Execution
- ✅ Secure sandboxing (isolated-vm)
- ✅ Real-time output streaming
- ✅ Resource limits (CPU, memory)
- ✅ Error handling

### AI Assistant
- ✅ Code explanations
- ✅ Test generation
- ✅ Refactoring suggestions
- ✅ Bug fixes

### Collaboration
- ✅ Multi-user support
- ✅ Live presence
- ✅ File change notifications

---

## 🐛 Troubleshooting

### Backend won't start
```powershell
# Check if port is in use
netstat -an | findstr :3001

# Kill process if needed
# Find PID, then:
taskkill /PID <pid> /F
```

### "Module not found" errors
```powershell
cd backend
npm install

cd ..\react-dashboard
npm install
```

### WebSocket connection fails
- Check `.env` has correct `CORS_ORIGIN`
- Restart both backend and frontend
- Clear browser cache

### AI features return errors
- Add API keys to `.env`
- Check API key validity
- Review backend console logs

---

## 📚 Next Steps

1. **Read**: `README.md` for architecture details
2. **Read**: `IMPLEMENTATION_SUMMARY.md` for full feature list
3. **Explore**: API endpoints in `routes/ide.ts`
4. **Extend**: Add Python/TypeScript support
5. **Deploy**: Set up production environment

---

## 🎓 Learn More

- **Monaco Editor**: https://microsoft.github.io/monaco-editor/
- **isolated-vm**: https://github.com/laverdet/isolated-vm
- **Socket.IO**: https://socket.io/docs/v4/
- **Express.js**: https://expressjs.com/

---

## 🎉 Success!

You now have a **real, functional live coding IDE** running on your machine.

**Not a mock-up. Not a PowerPoint. Real software.** 🚀

---

### Quick Test Checklist

- [ ] Backend running on port 3001
- [ ] Health endpoint responds: http://localhost:3001/health
- [ ] Can create files via API
- [ ] Can execute code successfully
- [ ] Frontend shows Monaco editor
- [ ] Terminal displays output
- [ ] AI features work (if API keys configured)

**All checked?** You're ready to code! 🎊
