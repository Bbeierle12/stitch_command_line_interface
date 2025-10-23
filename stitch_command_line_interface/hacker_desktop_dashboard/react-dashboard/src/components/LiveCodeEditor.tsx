import { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { 
  Play, 
  Save, 
  Upload, 
  FileCode, 
  Settings,
  RefreshCw,
  Download,
  Maximize2,
  Minimize2,
  type LucideIcon
} from 'lucide-react';

interface ControlButton {
  id: string;
  label: string;
  icon: LucideIcon;
  action: () => void;
  variant?: 'primary' | 'secondary' | 'success';
}

export function LiveCodeEditor() {
  // Editor state
  const [code, setCode] = useState(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Live Preview</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            padding: 2rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            text-align: center;
            background: rgba(255, 255, 255, 0.1);
            padding: 3rem;
            border-radius: 1rem;
            backdrop-filter: blur(10px);
        }
        h1 {
            font-size: 3rem;
            margin: 0 0 1rem 0;
        }
        button {
            background: white;
            color: #667eea;
            border: none;
            padding: 1rem 2rem;
            font-size: 1rem;
            border-radius: 0.5rem;
            cursor: pointer;
            font-weight: 600;
            transition: transform 0.2s;
        }
        button:hover {
            transform: scale(1.05);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Live Preview</h1>
        <p>Edit the code and see changes instantly!</p>
        <button onclick="alert('Hello from Live Preview!')">Click Me</button>
    </div>

    <script>
        console.log('Live preview loaded successfully!');
    </script>
</body>
</html>`);

  const [language, setLanguage] = useState<'html' | 'javascript' | 'typescript' | 'css' | 'python'>('html');
  const [previewKey, setPreviewKey] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editorHeight, setEditorHeight] = useState(50); // Percentage
  const [isResizingVertical, setIsResizingVertical] = useState(false);

  // Refs
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      // Enter fullscreen
      if (editorContainerRef.current) {
        if (editorContainerRef.current.requestFullscreen) {
          editorContainerRef.current.requestFullscreen();
        }
      }
      setIsFullscreen(true);
    } else {
      // Exit fullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes (ESC key, etc)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle vertical resize (editor height)
  useEffect(() => {
    if (!isResizingVertical) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (editorContainerRef.current) {
        const containerRect = editorContainerRef.current.getBoundingClientRect();
        const newHeight = ((e.clientY - containerRect.top) / containerRect.height) * 100;
        setEditorHeight(Math.min(Math.max(newHeight, 20), 80)); // Limit between 20% and 80%
      }
    };

    const handleMouseUp = () => {
      setIsResizingVertical(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingVertical]);



  // Auto-refresh preview when code changes
  useEffect(() => {
    if (autoRefresh && language === 'html') {
      const timeoutId = setTimeout(() => {
        refreshPreview();
      }, 1000); // 1 second debounce

      return () => clearTimeout(timeoutId);
    }
  }, [code, autoRefresh, language]);

  const addLog = (type: 'log' | 'error' | 'warn' | 'info' | 'success', message: string) => {
    // Logs will be sent to Console Tail instead
    console.log(`[${type.toUpperCase()}] ${message}`);
  };

  const refreshPreview = () => {
    if (language === 'html' && iframeRef.current) {
      try {
        const iframe = iframeRef.current;
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        
        if (doc) {
          // Inject console capture
          const wrappedCode = `
            <script>
              // Capture console output
              const originalLog = console.log;
              const originalError = console.error;
              const originalWarn = console.warn;
              
              window.addEventListener('error', (e) => {
                window.parent.postMessage({ type: 'console-error', message: e.message }, '*');
              });
              
              console.log = function(...args) {
                window.parent.postMessage({ type: 'console-log', message: args.join(' ') }, '*');
                originalLog.apply(console, args);
              };
              
              console.error = function(...args) {
                window.parent.postMessage({ type: 'console-error', message: args.join(' ') }, '*');
                originalError.apply(console, args);
              };
              
              console.warn = function(...args) {
                window.parent.postMessage({ type: 'console-warn', message: args.join(' ') }, '*');
                originalWarn.apply(console, args);
              };
            </script>
            ${code}
          `;
          
          doc.open();
          doc.write(wrappedCode);
          doc.close();
          
          addLog('info', 'Preview refreshed');
        }
      } catch (error) {
        addLog('error', `Failed to refresh preview: ${error}`);
      }
    } else if (language === 'javascript' || language === 'typescript') {
      // For JS/TS, just log that we'd execute it
      addLog('info', 'JavaScript execution would run here (requires backend)');
    }
    setPreviewKey(prev => prev + 1);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCode(content);
        
        // Detect language from file extension
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext === 'html') setLanguage('html');
        else if (ext === 'js') setLanguage('javascript');
        else if (ext === 'ts') setLanguage('typescript');
        else if (ext === 'css') setLanguage('css');
        else if (ext === 'py') setLanguage('python');
        
        addLog('success', `Loaded file: ${file.name}`);
      };
      reader.readAsText(file);
    }
  };

  const handleSave = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${language === 'html' ? 'html' : language === 'javascript' ? 'js' : language === 'typescript' ? 'ts' : language === 'css' ? 'css' : 'py'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addLog('success', 'File saved to downloads');
  };

  const handleRun = () => {
    addLog('info', 'Running code...');
    refreshPreview();
  };

  // Listen for console messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'console-log') {
        addLog('log', event.data.message);
      } else if (event.data.type === 'console-error') {
        addLog('error', event.data.message);
      } else if (event.data.type === 'console-warn') {
        addLog('warn', event.data.message);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const editorControls: ControlButton[] = [
    { id: 'run', label: 'Run', icon: Play, action: handleRun, variant: 'primary' },
    { id: 'save', label: 'Save', icon: Save, action: handleSave, variant: 'secondary' },
    { id: 'upload', label: 'Upload', icon: Upload, action: () => fileInputRef.current?.click(), variant: 'secondary' },
    { id: 'refresh', label: 'Refresh', icon: RefreshCw, action: refreshPreview, variant: 'secondary' },
  ];

  return (
    <div ref={editorContainerRef} className="flex h-full w-full bg-ink">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".html,.js,.ts,.css,.py,.txt"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Main Content Area - Editor and Preview */}
      <div className="flex-1 flex flex-col">
        {/* Editor */}
        <div 
          className="border-b border-hairline relative" 
          style={{ height: isFullscreen ? '100%' : `${editorHeight}%` }}
        >
          <div className="h-full flex flex-col">
            {/* Editor Navbar with Controls */}
            <div className="bg-panel/60 border-b border-hairline px-4 py-2 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-ops-green"></div>
                </div>
                <span className="text-xs text-white/60 uppercase tracking-wider border-l border-hairline pl-3">Editor</span>
                
                {/* Control Buttons */}
                <div className="flex items-center gap-2 border-l border-hairline pl-3">
                  {editorControls.map((control) => {
                    const Icon = control.icon;
                    return (
                      <button
                        key={control.id}
                        onClick={control.action}
                        title={control.label}
                        className={`
                          flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all
                          ${control.variant === 'primary' 
                            ? 'bg-cyan hover:bg-cyan/90 text-ink border border-cyan' 
                            : 'bg-panel hover:bg-hairline text-white/80 border border-hairline hover:border-cyan'
                          }
                        `}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{control.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Right Side Controls */}
              <div className="flex items-center gap-3">
                {/* Language Selector */}
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="bg-panel border border-hairline text-white/90 px-2 py-1 rounded text-xs focus:border-cyan outline-none"
                >
                  <option value="html">HTML</option>
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="css">CSS</option>
                  <option value="python">Python</option>
                </select>
                
                {/* Auto-refresh Toggle */}
                <label className="flex items-center gap-1.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="w-3.5 h-3.5 accent-cyan"
                  />
                  <span className="text-xs text-white/60 group-hover:text-white/80">Auto</span>
                </label>
                
                {/* Fullscreen Button */}
                <button
                  onClick={toggleFullscreen}
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                  className="p-1.5 hover:bg-hairline rounded transition-colors"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4 text-white/60" /> : <Maximize2 className="w-4 h-4 text-white/60" />}
                </button>
              </div>
            </div>
            <div className="flex-1">
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
                  wordWrap: 'on',
                }}
              />
            </div>
          </div>
          
          {/* Horizontal Resize Handle */}
          {!isFullscreen && (
            <div
              className="absolute bottom-0 left-0 right-0 h-1 bg-hairline hover:bg-cyan cursor-ns-resize z-10 transition-colors"
              onMouseDown={() => setIsResizingVertical(true)}
            >
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-1 bg-cyan/50 rounded-full"></div>
            </div>
          )}
        </div>

        {/* Bottom Section - Live Preview (Full Width) */}
        <div 
          className={`${isFullscreen ? 'hidden' : ''} relative`}
          style={{ height: isFullscreen ? '0%' : `${100 - editorHeight}%` }}
        >
          {/* Live Preview */}
          <div className="h-full">
            <div className="h-full flex flex-col">
              <div className="bg-panel/60 border-b border-hairline px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-ops-green animate-pulse"></div>
                  <span className="text-xs text-white/60 uppercase tracking-wider">Live Preview</span>
                </div>
                <span className="text-xs text-white/40">Key: {previewKey}</span>
              </div>
              <div className="flex-1 bg-white">
                {language === 'html' ? (
                  <iframe
                    ref={iframeRef}
                    key={previewKey}
                    title="Live Preview"
                    className="w-full h-full"
                    sandbox="allow-scripts"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-panel/40">
                    <div className="text-center">
                      <FileCode className="w-12 h-12 text-white/20 mx-auto mb-3" />
                      <p className="text-sm text-white/60">
                        Live preview available for HTML
                      </p>
                      <p className="text-xs text-white/40 mt-1">
                        Other languages require backend execution
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
