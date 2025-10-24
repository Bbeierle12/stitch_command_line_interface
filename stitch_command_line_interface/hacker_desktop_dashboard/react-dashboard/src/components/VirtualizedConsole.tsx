/**
 * Virtualized Console
 * High-performance log rendering using react-window
 */

import { memo } from 'react';
import { FixedSizeList } from 'react-window';
import type { ConsoleLog } from '../contexts/ConsoleContext';

interface VirtualizedConsoleProps {
  logs: ConsoleLog[];
  height: number;
  itemHeight?: number;
}

interface LogRowProps {
  index: number;
  style: React.CSSProperties;
data: ConsoleLog[];
}

const LogRow = memo(({ index, style, data }: LogRowProps) => {
  const line = data[index];
  
  return (
    <div style={style} className="flex items-center gap-3 py-1 px-4">
   <span className={`rounded border px-2 py-0.5 text-[10px] tracking-[0.16em] ${
        line.tag === "ERROR" ? "border-danger text-danger" :
        line.tag === "WARN" ? "border-warn text-warn" :
   line.tag === "SUCCESS" ? "border-ops-green text-ops-green" :
        "border-hairline text-white/50"
      }`}>
    {line.tag}
    </span>
      <span className="text-white/50 text-xs">{line.ts}</span>
      {line.source && (
        <span className="text-[10px] text-cyan/60">[{line.source}]</span>
      )}
      <span className={`flex-1 text-xs ${
      line.tag === "ERROR" ? "text-danger" : 
        line.tag === "WARN" ? "text-warn" :
        line.tag === "SUCCESS" ? "text-ops-green" :
   ""
      }`}>
        {line.message}
    </span>
    </div>
  );
});

LogRow.displayName = 'LogRow';

export const VirtualizedConsole = memo(({ 
  logs, 
  height, 
  itemHeight = 32 
}: VirtualizedConsoleProps) => {
  if (logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-white/40 text-sm">
      No logs yet. Start coding!
      </div>
    );
  }

  return (
    <FixedSizeList
      height={height}
      itemCount={logs.length}
      itemSize={itemHeight}
      width="100%"
      itemData={logs}
      className="scrollbar-thin scrollbar-thumb-hairline scrollbar-track-transparent"
    >
      {LogRow}
    </FixedSizeList>
  );
});

VirtualizedConsole.displayName = 'VirtualizedConsole';
