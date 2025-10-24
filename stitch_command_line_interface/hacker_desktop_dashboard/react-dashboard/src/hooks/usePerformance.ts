/**
 * Performance Hooks
 * Debounce, throttle, and memoization utilities
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import debounce from 'lodash.debounce';

/**
 * Debounced value hook
 * Delays updating value until user stops typing
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounced callback hook
 * Creates a debounced version of a callback function
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): (...args: Parameters<T>) => void {
  const debouncedFn = useMemo(
    () => debounce(callback, delay),
    [callback, delay]
  );

  useEffect(() => {
    return () => {
      debouncedFn.cancel();
    };
  }, [debouncedFn]);

  return debouncedFn;
}

/**
 * Throttled callback hook
 * Limits how often a function can be called
 */
export function useThrottle<T>(value: T, interval: number = 500): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastUpdated = useRef<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    
    if (now - lastUpdated.current >= interval) {
      lastUpdated.current = now;
      setThrottledValue(value);
    } else {
      const timer = setTimeout(() => {
        lastUpdated.current = Date.now();
        setThrottledValue(value);
      }, interval - (now - lastUpdated.current));

    return () => clearTimeout(timer);
 }
  }, [value, interval]);

  return throttledValue;
}

/**
 * Previous value hook
 * Track previous value of a state/prop
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
}

/**
 * Lazy initialization hook
 * Only initialize expensive computation once
 */
export function useLazyInit<T>(initializer: () => T): T {
  const [value] = useState<T>(initializer);
  return value;
}

/**
 * Memoized async function
 * Cache async results by key
 */
export function useAsyncMemo<T>(
  factory: () => Promise<T>,
  deps: React.DependencyList,
  initial?: T
): T | undefined {
  const [value, setValue] = useState<T | undefined>(initial);
  
  useEffect(() => {
    let cancelled = false;
    
    factory().then(result => {
      if (!cancelled) {
        setValue(result);
      }
 });
    
    return () => {
  cancelled = true;
    };
  }, deps);
  
  return value;
}

/**
 * Component did mount check
 * Useful for preventing updates on unmounted components
 */
export function useIsMounted(): () => boolean {
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
  return () => {
      isMounted.current = false;
    };
  }, []);

  return useCallback(() => isMounted.current, []);
}

/**
 * Force update hook
 * Trigger component re-render manually
 */
export function useForceUpdate(): () => void {
  const [, setValue] = useState(0);
  return useCallback(() => setValue(value => value + 1), []);
}
