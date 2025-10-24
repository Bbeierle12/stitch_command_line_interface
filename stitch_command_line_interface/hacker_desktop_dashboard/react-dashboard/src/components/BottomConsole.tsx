import { useState, useRef, KeyboardEvent } from "react";
import { useConsole } from "../contexts/ConsoleContext";
import { useDebouncedCallback } from "../hooks/usePerformance";

type TerminalType = "cmd" | "powershell";

export function BottomConsole() {
  const { logs, addLog, clearLogs } = useConsole();
  const [activeTerminal, setActiveTerminal] = useState<TerminalType>("powershell");
  const [command, setCommand] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const consoleHeight = 160 - 80; // Total height minus header/input areas

  // Debounced command execution to prevent spam
  const executeDebouncedCommand = useDebouncedCallback((cmd: string) => {
    // Mock responses for demo purposes
    if (cmd.toLowerCase().includes('dir') || cmd.toLowerCase().includes('ls')) {
      addLog('INFO', 'Directory listing: src/ components/ package.json', activeTerminal.toUpperCase());
    } else if (cmd.toLowerCase().includes('help')) {
      addLog('INFO', 'Available commands: help, dir, ls, clear, npm', activeTerminal.toUpperCase());
    } else if (cmd.toLowerCase().includes('clear')) {
      clearLogs();
    } else if (cmd.toLowerCase().includes('npm')) {
      addLog('INFO', 'npm command would execute in real terminal', activeTerminal.toUpperCase());
    } else {
      addLog('WARN', `Command not recognized: ${cmd}`, activeTerminal.toUpperCase());
    }
  }, 100);

  const handleSendCommand = () => {
    if (!command.trim()) return;

    // Add command to logs
    addLog('INFO', `> ${command}`, activeTerminal.toUpperCase());
 
    // Execute with debounce
    executeDebouncedCommand(command);
    setCommand("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendCommand();
    }
  };

  return (
    <footer className="border-t border-hairline bg-panel/80 flex-shrink-0">
      <div className="flex h-48 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-hairline px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-white/50">
          <div className="flex items-center gap-2">
            <span>Console Tail</span>
            <div className="ml-4 flex gap-1">
              <button
                onClick={() => setActiveTerminal("cmd")}
                className={`rounded border px-3 py-1 text-[10px] transition ${
                  activeTerminal === "cmd"
                    ? "border-cyan bg-cyan/10 text-cyan"
                    : "border-hairline text-white/50 hover:border-white/30 hover:text-white/70"
                }`}
              >
                CMD
              </button>
              <button
                onClick={() => setActiveTerminal("powershell")}
                className={`rounded border px-3 py-1 text-[10px] transition ${
                  activeTerminal === "powershell"
                    ? "border-cyan bg-cyan/10 text-cyan"
                    : "border-hairline text-white/50 hover:border-white/30 hover:text-white/70"
                }`}
              >
                PowerShell
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/40">{logs.length} entries</span>
            <button 
              onClick={clearLogs}
              className="rounded border border-transparent px-2 py-1 text-xs text-white/60 transition hover:border-cyan hover:text-cyan"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Console Logs */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-hairline scrollbar-track-transparent font-mono text-xs text-white/80 px-4 py-2">
          {logs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-white/40 text-sm">
              No logs yet. Start coding!
            </div>
          ) : (
            <div className="space-y-1">
              {logs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-white/30 shrink-0 w-16">{log.ts}</span>
                  <span className={`text-xs ${
                    log.tag === "ERROR" ? "text-danger" : 
                    log.tag === "WARN" ? "text-warn" :
                    log.tag === "SUCCESS" ? "text-ops-green" :
                    ""
                  }`}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Command Input */}
        <div className="flex items-center gap-3 border-t border-hairline px-4 py-2">
          <span className="text-xs uppercase tracking-[0.2em] text-white/40">
            {activeTerminal === "cmd" ? "C:\\>" : "PS>"}
          </span>
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              activeTerminal === "cmd" 
                ? "> dir /s /b *.log" 
                : "> Get-ChildItem -Recurse *.log"
            }
            className="w-full rounded border border-hairline bg-transparent px-3 py-1 text-sm text-white/80 outline-none transition focus:border-cyan"
          />
          <button 
            onClick={handleSendCommand}
            className="rounded border border-cyan px-3 py-1 text-xs uppercase tracking-[0.16em] text-cyan transition hover:bg-cyan/10"
          >
            Send
          </button>
        </div>
      </div>
    </footer>
  );
}
