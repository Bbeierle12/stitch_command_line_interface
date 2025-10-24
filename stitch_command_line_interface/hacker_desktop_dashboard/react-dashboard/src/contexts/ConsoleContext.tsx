/**
 * Console Context
 * Manages console logs across the application
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface ConsoleLog {
  id: number;
  tag: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'SUCCESS';
  message: string;
  ts: string;
  source?: string;
}

interface ConsoleContextType {
  logs: ConsoleLog[];
  addLog: (tag: ConsoleLog['tag'], message: string, source?: string) => void;
  clearLogs: () => void;
  maxLogs: number;
}

const ConsoleContext = createContext<ConsoleContextType | undefined>(undefined);

export function ConsoleProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const maxLogs = 100;

  const addLog = useCallback((tag: ConsoleLog['tag'], message: string, source?: string) => {
    const newLog: ConsoleLog = {
      id: Date.now() + Math.random(),
  tag,
      message,
      ts: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      source,
    };

    setLogs((prev) => {
      const updated = [...prev, newLog];
      // Keep only the last maxLogs entries
      return updated.slice(-maxLogs);
  });
  }, [maxLogs]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return (
    <ConsoleContext.Provider value={{ logs, addLog, clearLogs, maxLogs }}>
{children}
    </ConsoleContext.Provider>
  );
}

export function useConsole() {
  const context = useContext(ConsoleContext);
  if (!context) {
    throw new Error('useConsole must be used within a ConsoleProvider');
  }
  return context;
}
