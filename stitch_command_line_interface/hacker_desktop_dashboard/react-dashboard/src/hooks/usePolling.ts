import { useEffect, useRef, useState } from "react";

export function usePolling<T>(fetchFn: () => T | Promise<T>, intervalMs: number, enabled = true): T | null {
  const [data, setData] = useState<T | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (!enabled) return;

    const update = async () => {
      try {
        const result = await Promise.resolve(fetchFn());
        if (mounted.current) setData(result);
      } catch (e) {
        // swallow polling errors; consider logging later
      }
    };

    // initial fetch
    void update();

    const id = setInterval(update, intervalMs);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [fetchFn, intervalMs, enabled]);

  return data;
}

export function useKeyboardShortcut(key: string, callback: () => void, modifiers: { ctrl?: boolean; alt?: boolean; shift?: boolean } = {}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const matchesKey = e.key.toLowerCase() === key.toLowerCase();
      const matchesCtrl = modifiers.ctrl ? e.ctrlKey || e.metaKey : true;
      const matchesAlt = modifiers.alt ? e.altKey : !e.altKey;
      const matchesShift = modifiers.shift ? e.shiftKey : !e.shiftKey;

      if (matchesKey && matchesCtrl && matchesAlt && matchesShift) {
        e.preventDefault();
        callback();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [key, callback, modifiers]);
}
