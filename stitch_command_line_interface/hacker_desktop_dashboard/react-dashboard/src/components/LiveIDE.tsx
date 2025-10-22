/**
 * Live IDE Component
 * A fully functional code editor with execution, file management, and AI assistance
 */

import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { io, Socket } from 'socket.io-client';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

interface ExecutionResult {
  id: string;
  status: string;
  output: string;
  error?: string;
  runtime: number;
}

export const LiveIDE: React.FC = () => {
  // State
  const [code, setCode] = useState('// Welcome to SecureCode IDE\nconsole.log("Hello, secure world!");');
  const [output, setOutput] = useState('> Ready to execute code...\n');
  const [files, setFiles] = useState<FileNode[]>([]);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [language, setLanguage] = useState('javascript');
  const [isExecuting, setIsExecuting] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);

  // Refs
  const outputRef = useRef<HTMLDivElement>(null);

  // Initialize WebSocket
  useEffect(() => {
    const newSocket = io('http://localhost:3001', {
      query: { username: 'Developer' },
    });
    
    setSocket(newSocket);

    // Listen for execution results
    newSocket.on('execution:result', (result: ExecutionResult) => {
      setIsExecuting(false);
      appendOutput(`\n[Execution completed in ${result.runtime}ms]\n`);
      if (result.output) {
        appendOutput(result.output);
      }
      if (result.error) {
        appendOutput(`\n❌ Error: ${result.error}\n`, 'error');
      }
    });

    // Listen for file changes from other users
    newSocket.on('file:changed', (data: any) => {
      appendOutput(`\n📝 ${data.username} modified ${data.path}\n`, 'info');
    });

    // Listen for user join/leave
    newSocket.on('user:join', (data: any) => {
      appendOutput(`\n👋 ${data.username} joined\n`, 'info');
    });

    newSocket.on('user:leave', (data: any) => {
      appendOutput(`\n👋 ${data.username} left\n`, 'info');
    });

    // Load initial file tree
    loadFiles();

    return () => {
      newSocket.close();
    };
  }, []);

  // Helper functions
  const appendOutput = (text: string, type: 'normal' | 'error' | 'info' = 'normal') => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌' : type === 'info' ? 'ℹ️' : '>';
    setOutput(prev => prev + `[${timestamp}] ${prefix} ${text}\n`);
    
    // Auto-scroll to bottom
    setTimeout(() => {
      if (outputRef.current) {
        outputRef.current.scrollTop = outputRef.current.scrollHeight;
      }
    }, 10);
  };

  const loadFiles = () => {
    if (socket) {
      socket.emit('files:list', {}, (response: any) => {
        if (response.success) {
          setFiles(response.data);
        }
      });
    }
  };

  const openFile = (file: FileNode) => {
    if (file.type === 'file' && socket) {
      socket.emit('file:read', { path: file.path }, (response: any) => {
        if (response.success) {
          setCode(response.data.content);
          setCurrentFile(file.path);
          
          // Detect language from file extension
          const ext = file.name.split('.').pop();
          const langMap: Record<string, string> = {
            'js': 'javascript',
            'ts': 'typescript',
            'jsx': 'javascript',
            'tsx': 'typescript',
            'py': 'python',
            'java': 'java',
            'cpp': 'cpp',
            'c': 'c',
            'rs': 'rust',
            'go': 'go',
            'html': 'html',
            'css': 'css',
            'json': 'json',
            'md': 'markdown',
          };
          setLanguage(langMap[ext || 'js'] || 'javascript');
          
          appendOutput(`Opened: ${file.path}`);
        }
      });
    }
  };

  const saveFile = () => {
    if (socket && currentFile) {
      socket.emit('file:write', { path: currentFile, content: code }, (response: any) => {
        if (response.success) {
          appendOutput(`Saved: ${currentFile}`, 'info');
        } else {
          appendOutput(`Failed to save: ${response.error}`, 'error');
        }
      });
    }
  };

  const runCode = () => {
    if (!socket || isExecuting) return;
    
    setIsExecuting(true);
    setOutput(prev => prev + '\n─────────────────────────────\n');
    appendOutput('Executing code in secure sandbox...');
    
    socket.emit('code:execute', {
      code,
      language,
      timeout: 30000,
    }, (response: any) => {
      if (!response.success) {
        setIsExecuting(false);
        appendOutput(response.error, 'error');
      }
    });
  };

  const explainCode = () => {
    if (!socket) return;
    
    setShowAIPanel(true);
    setAiResponse('🤔 Analyzing code...');
    
    socket.emit('ai:explain', {
      code,
      language,
    }, (response: any) => {
      if (response.success) {
        setAiResponse(response.explanation);
      } else {
        setAiResponse(`❌ Error: ${response.error}`);
      }
    });
  };

  const generateTests = () => {
    if (!socket) return;
    
    setShowAIPanel(true);
    setAiResponse('🧪 Generating tests...');
    
    socket.emit('ai:generate-tests', {
      code,
      language,
    }, (response: any) => {
      if (response.success) {
        setAiResponse(response.tests);
      } else {
        setAiResponse(`❌ Error: ${response.error}`);
      }
    });
  };

  const refactorCode = () => {
    if (!socket) return;
    
    setShowAIPanel(true);
    setAiResponse('♻️ Refactoring...');
    
    socket.emit('ai:refactor', {
      code,
      language,
      instructions: 'improve code quality and readability',
    }, (response: any) => {
      if (response.success) {
        setAiResponse(response.refactored);
      } else {
        setAiResponse(`❌ Error: ${response.error}`);
      }
    });
  };

  const clearOutput = () => {
    setOutput('> Output cleared\n');
  };

  // Render file tree
  const renderFileTree = (nodes: FileNode[], level: number = 0) => {
    return nodes.map(node => (
      <div key={node.path} style={{ paddingLeft: `${level * 16}px` }}>
        <div
          className={`flex items-center gap-2 px-2 py-1 hover:bg-gray-700 cursor-pointer ${
            currentFile === node.path ? 'bg-green-900' : ''
          }`}
          onClick={() => node.type === 'file' && openFile(node)}
        >
          <span className="text-lg">
            {node.type === 'directory' ? '📁' : '📄'}
          </span>
          <span className="text-sm">{node.name}</span>
        </div>
        {node.children && renderFileTree(node.children, level + 1)}
      </div>
    ));
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="bg-black border-b border-gray-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-green-500 text-xl">🔐</span>
          <h1 className="text-lg font-bold">SecureCode IDE</h1>
          {currentFile && (
            <span className="text-gray-400 text-sm ml-4">
              {currentFile}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span>SECURE</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* File Explorer */}
        <aside className="w-64 bg-gray-800 border-r border-gray-700 overflow-auto">
          <div className="p-3 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-sm font-semibold">Files</h2>
            <button
              onClick={loadFiles}
              className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded"
            >
              🔄
            </button>
          </div>
          <div className="p-2">
            {renderFileTree(files)}
          </div>
        </aside>

        {/* Editor */}
        <main className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex gap-2">
            <button
              onClick={runCode}
              disabled={isExecuting}
              className={`px-4 py-1 rounded font-medium flex items-center gap-2 ${
                isExecuting
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isExecuting ? '⏳' : '▶️'} Run
            </button>
            <button
              onClick={saveFile}
              disabled={!currentFile}
              className="px-4 py-1 bg-blue-600 hover:bg-blue-700 rounded font-medium disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              💾 Save
            </button>
            <div className="flex-1"></div>
            <button
              onClick={explainCode}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm"
            >
              🤖 Explain
            </button>
            <button
              onClick={generateTests}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm"
            >
              🧪 Tests
            </button>
            <button
              onClick={refactorCode}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm"
            >
              ♻️ Refactor
            </button>
          </div>

          {/* Editor Area */}
          <div className="flex-1 relative">
            <Editor
              height="100%"
              language={language}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                minimap: { enabled: true },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: true,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
              }}
            />
          </div>

          {/* Status Bar */}
          <div className="bg-gray-800 border-t border-gray-700 px-4 py-1 flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-4">
              <span>Language: {language}</span>
              <span>UTF-8</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🔒</span>
              <span>CLASSIFIED</span>
            </div>
          </div>
        </main>

        {/* Output Panel */}
        <section className="w-96 bg-black border-l border-gray-700 flex flex-col">
          <div className="p-3 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-green-400">Terminal Output</h2>
            <button
              onClick={clearOutput}
              className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded"
            >
              Clear
            </button>
          </div>
          <div
            ref={outputRef}
            className="flex-1 p-4 overflow-auto font-mono text-xs text-green-400"
            style={{ lineHeight: '1.6' }}
          >
            <pre>{output}</pre>
          </div>
        </section>
      </div>

      {/* AI Assistant Panel */}
      {showAIPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg w-3/4 max-w-4xl max-h-3/4 overflow-auto">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold">🤖 AI Assistant</h3>
              <button
                onClick={() => setShowAIPanel(false)}
                className="text-2xl hover:text-red-500"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <pre className="whitespace-pre-wrap text-sm bg-gray-900 p-4 rounded">
                {aiResponse}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveIDE;
