# 🔐 SecureCode IDE - Live Coding Environment

A **secure, production-ready live coding IDE** with AI assistance, real-time collaboration, and sandboxed code execution.

## 🎯 What This Actually Is

This is **NOT** a collection of mock-ups or PowerPoint prototypes. This is a **fully functional, live coding IDE** that:

- ✅ Runs code in sandboxed environments with resource limits
- ✅ Provides real-time AI code assistance (explain, test generation, refactoring)
- ✅ Supports multi-user collaboration with operational transforms
- ✅ Streams execution output via WebSockets
- ✅ Manages workspaces with full CRUD operations
- ✅ Deploys code securely with audit logging
- ✅ Uses Monaco Editor (VS Code's engine) for professional editing

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Monaco Editor│  │ File Explorer│  │ Live Terminal   │  │
│  │ (Live Edit)  │  │ (Real Files) │  │ (WebSocket)     │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ AI Assistant │  │ Collaboration│  │ Deploy Controls │  │
│  │ (LLM Service)│  │ (CRDT/OT)    │  │ (Git/CI/CD)     │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │ WebSocket / REST API
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Express Backend (TypeScript)                │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Workspace    │  │ Execution    │  │ LLM Service     │  │
│  │ Service      │  │ Service      │  │ (OpenAI/Claude) │  │
│  │ (File CRUD)  │  │ (Sandboxed)  │  │                 │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ WebSocket    │  │ Auth & RBAC  │  │ Audit Logger    │  │
│  │ Server       │  │ (JWT)        │  │ (Winston)       │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────────┐
         │      Sandboxed Execution Layer      │
         │  (VM2 / Docker / Resource Limits)   │
         └─────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm 9+
- **Git** for version control
- **OpenAI** or **Anthropic API key** (optional, for AI features)

### Installation

```powershell
# Clone the repository
git clone https://github.com/Bbeierle12/stitch_command_line_interface.git
cd stitch_command_line_interface

# Install backend dependencies
cd stitch_command_line_interface/hacker_desktop_dashboard/backend
npm install

# Install frontend dependencies
cd ../react-dashboard
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your API keys
```

### Configuration

Create `backend/.env`:
```env
PORT=3001
NODE_ENV=development

# LLM API Keys (optional)
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here

# Security
JWT_SECRET=your_secure_random_secret
CORS_ORIGIN=http://localhost:5173

# Execution Limits
MAX_EXECUTION_TIME_MS=30000
MAX_MEMORY_MB=512
MAX_OUTPUT_SIZE_KB=1024

# Workspace
WORKSPACE_ROOT=./workspace
ALLOW_FILE_SYSTEM_ACCESS=true
```

### Running the IDE

```powershell
# Terminal 1: Start backend server
cd backend
npm run dev

# Terminal 2: Start frontend dev server
cd react-dashboard
npm run dev

# Access the IDE at: http://localhost:5173
```

### Running in Electron (Desktop App)

```powershell
cd react-dashboard
npm run electron:dev
```

## 🔒 Security Features

### Sandboxed Execution
- **VM2** isolates code execution in separate contexts
- **Resource limits**: CPU time, memory, file system access
- **Network isolation**: No outbound connections by default
- **Read-only workspace**: Code runs with immutable file system

### Audit Logging
Every action is logged with:
- User ID and session
- Timestamp and IP address
- Action type (execute, deploy, edit)
- Code hash and diff
- Execution results and errors

### Authentication & Authorization
- **JWT-based** session management
- **Role-based access control** (RBAC)
- **API rate limiting** (100 requests/15 minutes per IP)
- **Input validation** with Joi schemas

### Secure Deployment
- **Code review** required before deployment
- **Git integration** with signed commits
- **CI/CD hooks** with automated testing
- **Rollback** capability for failed deployments

## 📚 Features

### 1. Live Code Editor (Monaco)
- **Syntax highlighting** for 50+ languages
- **IntelliSense** autocomplete
- **Multi-cursor editing**
- **Find/replace** with regex
- **Bracket matching** and auto-closing
- **Minimap** and breadcrumbs

### 2. File Management
- **Create/read/update/delete** files and folders
- **Drag-and-drop** file upload
- **Search** across workspace
- **Git status** indicators
- **File type** icons

### 3. Live Execution
- **Run code** in sandboxed environment
- **Real-time output** streaming via WebSocket
- **Error highlighting** with stack traces
- **Input/output** capture
- **Performance metrics** (time, memory)

### 4. AI Code Assistant
Powered by OpenAI GPT-4 or Anthropic Claude:
- **Explain code**: Get natural language explanations
- **Generate tests**: Auto-create unit tests
- **Refactor**: Suggest improvements
- **Fix bugs**: Identify and fix issues
- **Documentation**: Generate docstrings

### 5. Real-Time Collaboration
- **Multi-user editing** with conflict resolution
- **Live cursors** showing other users' positions
- **Presence indicators** (who's online)
- **Change notifications** (who edited what)

### 6. Deployment
- **Git push** with automatic commits
- **CI/CD triggers** (GitHub Actions, Jenkins)
- **Cloud deployment** (AWS, GCP, Azure)
- **Rollback** on failure

## 🧪 Testing

```powershell
# Backend tests
cd backend
npm test                # Run all tests
npm run test:coverage   # Coverage report
npm run test:watch      # Watch mode

# Frontend tests
cd react-dashboard
npm test
```

## 📖 API Documentation

### REST Endpoints

#### Workspace Management
- `GET /api/workspace/files` - List all files
- `GET /api/workspace/files/:path` - Read file
- `POST /api/workspace/files` - Create file
- `PUT /api/workspace/files/:path` - Update file
- `DELETE /api/workspace/files/:path` - Delete file

#### Code Execution
- `POST /api/execute` - Run code in sandbox
- `GET /api/execute/:id` - Get execution status
- `DELETE /api/execute/:id` - Cancel execution

#### AI Assistant
- `POST /api/ai/explain` - Explain code
- `POST /api/ai/test` - Generate tests
- `POST /api/ai/refactor` - Suggest refactorings
- `POST /api/ai/fix` - Fix bugs

#### Deployment
- `POST /api/deploy` - Deploy code
- `GET /api/deploy/:id` - Deployment status
- `POST /api/deploy/:id/rollback` - Rollback deployment

### WebSocket Events

#### Client → Server
- `code:change` - User edited code
- `cursor:move` - Cursor position changed
- `file:open` - User opened file
- `execute:start` - Start code execution

#### Server → Client
- `code:update` - Code changed by another user
- `cursor:update` - Other user's cursor moved
- `execution:output` - Execution stdout/stderr
- `execution:complete` - Execution finished

## 🛠️ Development

### Project Structure
```
backend/
├── src/
│   ├── services/
│   │   ├── workspaceService.ts    # File CRUD operations
│   │   ├── executionService.ts    # Sandboxed code execution
│   │   ├── llmService.ts          # AI assistant
│   │   └── deploymentService.ts   # Git/CI/CD integration
│   ├── routes/
│   │   ├── workspace.routes.ts
│   │   ├── execution.routes.ts
│   │   ├── ai.routes.ts
│   │   └── deployment.routes.ts
│   ├── websocket/
│   │   └── ideHandler.ts          # WebSocket handlers
│   └── middleware/
│       ├── auth.middleware.ts
│       ├── validation.middleware.ts
│       └── audit.middleware.ts

react-dashboard/
├── src/
│   ├── components/
│   │   ├── LiveIDE.tsx            # Main IDE component
│   │   ├── MonacoEditor.tsx       # Code editor wrapper
│   │   ├── FileExplorer.tsx       # File tree
│   │   ├── Terminal.tsx           # Output console
│   │   └── AIAssistant.tsx        # AI sidebar
│   ├── services/
│   │   ├── workspaceService.ts    # API client
│   │   ├── executionService.ts
│   │   └── websocketService.ts
│   └── hooks/
│       ├── useEditor.ts
│       ├── useCollaboration.ts
│       └── useExecution.ts
```

### Adding New Features

1. **Backend service**: Create in `backend/src/services/`
2. **REST routes**: Add to `backend/src/routes/`
3. **WebSocket handlers**: Update `backend/src/websocket/`
4. **Frontend component**: Create in `react-dashboard/src/components/`
5. **API client**: Add methods to `react-dashboard/src/services/`
6. **Tests**: Add to `backend/tests/` and update coverage

### Code Standards
- **TypeScript** strict mode
- **ESLint** with Airbnb config
- **Prettier** for formatting
- **Jest** for unit tests (>80% coverage)
- **Conventional commits** for git

## 🤝 Contributing

This is a production-ready IDE, not a prototype. Contributions must:
1. Include comprehensive tests
2. Follow security best practices
3. Update documentation
4. Pass all CI checks

## 📝 License

UNLICENSED - Private project

## 🎓 Learning Resources

- [Monaco Editor API](https://microsoft.github.io/monaco-editor/api/index.html)
- [VM2 Documentation](https://github.com/patriksimek/vm2)
- [WebSocket Protocol](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- [Operational Transforms](https://operational-transformation.github.io/)

## 🐛 Known Issues

- [ ] Large file uploads (>10MB) may timeout
- [ ] Real-time collaboration limited to 50 concurrent users
- [ ] Monaco IntelliSense for custom modules requires configuration

## 🗺️ Roadmap

- [ ] **Language support**: Python, Java, C++, Rust
- [ ] **Debugger integration**: Breakpoints, watch variables
- [ ] **Plugin system**: VSCode extension compatibility
- [ ] **Cloud workspaces**: Sync across devices
- [ ] **Mobile support**: Responsive design for tablets

---

**Built with ❤️ and actual code, not PowerPoint slides.**
