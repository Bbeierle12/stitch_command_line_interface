import { useEffect, useState } from "react";
import { useKeyboardShortcut } from "../hooks/usePolling";
import { electronService } from "../services/electronService";

type CommandItem = {
  id: string;
  label: string;
  verb: string;
  risk: "low" | "med" | "high";
  preview?: string;
};

const commands: CommandItem[] = [
  { id: "restart-dev", label: "Restart dev server", verb: "run", risk: "low", preview: "npm run dev" },
  { id: "run-tests", label: "Run all tests", verb: "run", risk: "low", preview: "npm test" },
  { id: "format-all", label: "Format all files", verb: "format", risk: "low", preview: "prettier --write ." },
  { id: "kill-process", label: "Kill noisy process", verb: "kill", risk: "med", preview: "pkill -9 node" },
  { id: "strict-wifi", label: "Enable strict Wi-Fi profile", verb: "config", risk: "med", preview: "sudo networksetup -setairportnetwork..." },
  { id: "panic", label: "Emergency panic mode", verb: "panic", risk: "high", preview: "Will disconnect VPN, clear logs, lock vault" }
];

type CommandPaletteProps = {
  isOpen: boolean;
  onClose: () => void;
  onExecute: (cmd: CommandItem) => void;
};

export function CommandPalette({ isOpen, onClose, onExecute }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setSelected(0);
    }
  }, [isOpen]);

  useKeyboardShortcut("Escape", () => isOpen && onClose());

  if (!isOpen) return null;

  const filtered = commands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(query.toLowerCase()) ||
      cmd.verb.toLowerCase().includes(query.toLowerCase())
  );

  const handleExecute = () => {
    if (filtered[selected]) {
      onExecute(filtered[selected]);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-24 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-lg border border-cyan/40 bg-panel shadow-depth"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-hairline p-4">
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelected((s) => (s + 1) % filtered.length);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelected((s) => (s - 1 + filtered.length) % filtered.length);
              } else if (e.key === "Enter") {
                e.preventDefault();
                handleExecute();
              }
            }}
            placeholder="Search commands... (verb or action)"
            className="w-full bg-transparent text-lg text-white/90 outline-none placeholder:text-white/40"
          />
        </div>
        <div className="max-h-96 overflow-y-auto scrollbar-thin">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-white/50">No commands match "{query}"</div>
          ) : (
            <ul>
              {filtered.map((cmd, idx) => (
                <li
                  key={cmd.id}
                  className={`cursor-pointer border-b border-hairline/40 p-4 transition ${
                    idx === selected ? "bg-cyan/10" : "hover:bg-hairline"
                  }`}
                  onClick={() => {
                    setSelected(idx);
                    handleExecute();
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-white/90">{cmd.label}</span>
                        <span
                          className={`rounded px-2 py-0.5 text-xs uppercase tracking-[0.14em] ${
                            cmd.risk === "high"
                              ? "border border-danger text-danger"
                              : cmd.risk === "med"
                              ? "border border-warn text-warn"
                              : "border border-hairline text-white/50"
                          }`}
                        >
                          {cmd.risk}
                        </span>
                      </div>
                      {cmd.preview && (
                        <pre className="mt-2 overflow-x-auto text-xs text-white/60 font-mono">{cmd.preview}</pre>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t border-hairline bg-ink/40 px-4 py-2 text-xs text-white/50">
          <kbd className="rounded border border-hairline px-2 py-1">↑↓</kbd> Navigate •{" "}
          <kbd className="rounded border border-hairline px-2 py-1">Enter</kbd> Execute •{" "}
          <kbd className="rounded border border-hairline px-2 py-1">Esc</kbd> Close
        </div>
      </div>
    </div>
  );
}
