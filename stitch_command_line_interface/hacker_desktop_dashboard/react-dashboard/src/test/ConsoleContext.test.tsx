/**
 * Console Context Tests
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ConsoleProvider, useConsole } from '../contexts/ConsoleContext';
import type { ReactNode } from 'react';

const wrapper = ({ children }: { children: ReactNode }) => (
  <ConsoleProvider>{children}</ConsoleProvider>
);

describe('ConsoleContext', () => {
  describe('useConsole hook', () => {
    it('should throw error when used outside provider', () => {
expect(() => {
        renderHook(() => useConsole());
      }).toThrow('useConsole must be used within a ConsoleProvider');
    });

    it('should provide console context', () => {
      const { result } = renderHook(() => useConsole(), { wrapper });
   
      expect(result.current).toHaveProperty('logs');
      expect(result.current).toHaveProperty('addLog');
      expect(result.current).toHaveProperty('clearLogs');
expect(result.current).toHaveProperty('maxLogs');
    });
  });

  describe('addLog', () => {
    it('should add a log entry', () => {
      const { result } = renderHook(() => useConsole(), { wrapper });
   
    act(() => {
        result.current.addLog('INFO', 'Test message', 'TestSource');
      });
      
      expect(result.current.logs).toHaveLength(1);
      expect(result.current.logs[0]).toMatchObject({
        tag: 'INFO',
      message: 'Test message',
        source: 'TestSource',
      });
    expect(result.current.logs[0]).toHaveProperty('id');
      expect(result.current.logs[0]).toHaveProperty('ts');
    });

    it('should add multiple logs', () => {
      const { result } = renderHook(() => useConsole(), { wrapper });
      
   act(() => {
        result.current.addLog('INFO', 'First');
        result.current.addLog('WARN', 'Second');
        result.current.addLog('ERROR', 'Third');
      });
      
 expect(result.current.logs).toHaveLength(3);
      expect(result.current.logs[0].message).toBe('First');
      expect(result.current.logs[1].message).toBe('Second');
      expect(result.current.logs[2].message).toBe('Third');
    });

    it('should limit logs to maxLogs', () => {
      const { result } = renderHook(() => useConsole(), { wrapper });
      const maxLogs = result.current.maxLogs;
      
      act(() => {
        // Add more than maxLogs entries
        for (let i = 0; i < maxLogs + 10; i++) {
          result.current.addLog('INFO', `Message ${i}`);
        }
      });
      
      expect(result.current.logs).toHaveLength(maxLogs);
      // Should keep most recent logs
      expect(result.current.logs[0].message).toBe('Message 10');
    });

    it('should support all log tags', () => {
      const { result } = renderHook(() => useConsole(), { wrapper });
 const tags: Array<'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'SUCCESS'> = [
        'INFO', 'WARN', 'ERROR', 'DEBUG', 'SUCCESS'
  ];
      
      act(() => {
        tags.forEach(tag => {
          result.current.addLog(tag, `${tag} message`);
        });
      });
    
      expect(result.current.logs).toHaveLength(5);
      tags.forEach((tag, index) => {
        expect(result.current.logs[index].tag).toBe(tag);
      });
    });
  });

  describe('clearLogs', () => {
    it('should clear all logs', () => {
      const { result } = renderHook(() => useConsole(), { wrapper });
      
      act(() => {
        result.current.addLog('INFO', 'Test 1');
        result.current.addLog('INFO', 'Test 2');
        result.current.addLog('INFO', 'Test 3');
      });
 
      expect(result.current.logs).toHaveLength(3);
      
act(() => {
        result.current.clearLogs();
    });
      
  expect(result.current.logs).toHaveLength(0);
    });
  });

  describe('log properties', () => {
    it('should generate unique IDs', () => {
      const { result } = renderHook(() => useConsole(), { wrapper });
      
      act(() => {
        result.current.addLog('INFO', 'Test 1');
        result.current.addLog('INFO', 'Test 2');
      });
 
      const id1 = result.current.logs[0].id;
      const id2 = result.current.logs[1].id;
   
      expect(id1).not.toBe(id2);
    });

    it('should format timestamp correctly', () => {
 const { result } = renderHook(() => useConsole(), { wrapper });
      
      act(() => {
        result.current.addLog('INFO', 'Test');
      });
      
      const timestamp = result.current.logs[0].ts;
  
      // Check format includes time (flexible format for AM/PM or 24-hour)
      expect(timestamp).toMatch(/\d{1,2}:\d{2}:\d{2}/);
    });

    it('should handle missing source', () => {
      const { result } = renderHook(() => useConsole(), { wrapper });
      
      act(() => {
        result.current.addLog('INFO', 'No source');
      });

    expect(result.current.logs[0].source).toBeUndefined();
    });
  });
});
