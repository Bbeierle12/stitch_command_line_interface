/**
 * Performance Hooks Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { 
  useDebounce, 
  useDebouncedCallback,
  useThrottle,
  usePrevious,
  useIsMounted
} from '../hooks/usePerformance';

describe('useDebounce', () => {
  it('should debounce value updates', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
    { initialProps: { value: 'initial', delay: 200 } }
    );
    
    expect(result.current).toBe('initial');
    
    // Change value
    rerender({ value: 'updated', delay: 200 });
    
 // Value should not update immediately
    expect(result.current).toBe('initial');
    
    // Wait for debounce delay
 await waitFor(() => expect(result.current).toBe('updated'), { timeout: 300 });
  });

  it('should use custom delay', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
  { initialProps: { value: 'start', delay: 500 } }
    );
    
    rerender({ value: 'end', delay: 500 });
    
    // Should still be old value after 300ms
    await new Promise(resolve => setTimeout(resolve, 300));
    expect(result.current).toBe('start');

    // Should update after 500ms
    await waitFor(() => expect(result.current).toBe('end'), { timeout: 600 });
  });
});

describe('useDebouncedCallback', () => {
  it('should debounce callback execution', async () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 200));
    
    act(() => {
      result.current('test1');
      result.current('test2');
      result.current('test3');
    });
 
    // Should not call immediately
    expect(callback).not.toHaveBeenCalled();

    // Should call once after delay
    await waitFor(() => expect(callback).toHaveBeenCalledTimes(1), { timeout: 300 });
    expect(callback).toHaveBeenCalledWith('test3');
  });
});

describe('useThrottle', () => {
  it('should throttle value updates', async () => {
const { result, rerender } = renderHook(
      ({ value }) => useThrottle(value, 200),
      { initialProps: { value: 1 } }
 );
    
    expect(result.current).toBe(1);
    
    // Rapid updates
    rerender({ value: 2 });
    rerender({ value: 3 });
    rerender({ value: 4 });
    
    // Should update to first new value
    await waitFor(() => expect(result.current).toBe(4), { timeout: 300 });
  });
});

describe('usePrevious', () => {
  it('should track previous value', () => {
    const { result, rerender } = renderHook(
({ value }) => usePrevious(value),
  { initialProps: { value: 'initial' } }
    );
    
    expect(result.current).toBeUndefined();
    
 rerender({ value: 'updated' });
    expect(result.current).toBe('initial');
    
    rerender({ value: 'latest' });
    expect(result.current).toBe('updated');
  });
});

describe('useIsMounted', () => {
  it('should return true when mounted', () => {
    const { result } = renderHook(() => useIsMounted());
    
  expect(result.current()).toBe(true);
  });

  it('should return false after unmount', () => {
    const { result, unmount } = renderHook(() => useIsMounted());
    
    expect(result.current()).toBe(true);
    
    unmount();
    
 expect(result.current()).toBe(false);
  });
});
