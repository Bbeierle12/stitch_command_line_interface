import { useState, useEffect } from 'react';
import { wsClient } from '../services/wsClient';
import { 
  GitBranch, 
  Wifi, 
  WifiOff,
  Terminal,
  PlayCircle,
  PauseCircle,
  Calendar,
  Loader2
} from 'lucide-react';

type TimeWindowMode = "live" | "fixed";
type BuildStatus = 'idle' | 'building' | 'success' | 'error';

export type HUDProps = {
  snapshotLabel: string;
  timeMode: TimeWindowMode;
  timeRangeLabel: string;
  onToggleMode: () => void;
  onCommandPalette: () => void;
  onSettings?: () => void;
  projectName?: string;
  branch?: string;
  buildStatus?: BuildStatus;
};

export function TopHud({ 
  snapshotLabel, 
  timeMode, 
  timeRangeLabel, 
  onToggleMode, 
  onCommandPalette,
  onSettings,
  projectName = 'stitch-cli',
  branch = 'main',
  buildStatus = 'idle'
}: HUDProps) {
  const [isConnected, setIsConnected] = useState(wsClient.isConnected());
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  });

  // Monitor WebSocket connection status
  useEffect(() => {
    const updateConnectionStatus = () => {
  setIsConnected(wsClient.isConnected());
    };

    const unsubConnect = wsClient.onConnect(updateConnectionStatus);
    const unsubDisconnect = wsClient.onDisconnect(updateConnectionStatus);

    // Initial connection attempt
 if (!wsClient.isConnected()) {
      wsClient.connect();
    }

    return () => {
      unsubConnect();
      unsubDisconnect();
    };
}, []);

  const handleConnectionToggle = () => {
    if (isConnected) {
      wsClient.disconnect();
    } else {
  wsClient.connect();
    }
  };

  const getBuildStatusIndicator = () => {
    switch(buildStatus) {
      case 'building':
        return (
          <div className="flex items-center gap-1 text-warn">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="text-[11px] uppercase tracking-[0.16em]">Building...</span>
          </div>
        );
      case 'success':
        return (
          <div className="flex items-center gap-1 text-ops-green">
            <div className="w-2 h-2 rounded-full bg-ops-green" />
            <span className="text-[11px] uppercase tracking-[0.16em]">Ready</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1 text-danger">
            <div className="w-2 h-2 rounded-full bg-danger" />
            <span className="text-[11px] uppercase tracking-[0.16em]">Failed</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-hairline bg-ink/95 px-4 backdrop-blur" role="banner">
      {/* Project Info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white/90">{projectName}</span>
          <div className="flex items-center gap-1 px-2 py-1 bg-panel/60 rounded border border-hairline">
            <GitBranch className="w-3 h-3 text-white/60" />
            <span className="text-[11px] text-white/70 uppercase tracking-[0.14em]">{branch}</span>
          </div>
        </div>
        
        {/* Build Status */}
        {getBuildStatusIndicator()}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {/* Live/Snapshot Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleMode}
            className={`
              flex items-center gap-2 px-3 py-1 rounded transition-all
              border ${timeMode === 'live' 
                ? 'border-ops-green bg-ops-green/10 text-ops-green' 
                : 'border-hairline bg-panel/60 text-white/70 hover:border-cyan hover:text-cyan'
              }
            `}
            aria-label={`Toggle time mode, currently ${timeMode}`}
          >
            {timeMode === 'live' ? (
              <>
                <PlayCircle className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-[0.14em]">Live</span>
              </>
            ) : (
              <>
                <PauseCircle className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-[0.14em]">Snapshot</span>
              </>
            )}
          </button>
        </div>

        {/* Time Control */}
        {timeMode === 'fixed' && (
          <div className="flex items-center gap-2 px-3 py-1 bg-panel/60 rounded border border-hairline">
            <Calendar className="w-4 h-4 text-white/60" />
            <input
              type="datetime-local"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white/90 text-xs outline-none cursor-pointer"
              style={{ colorScheme: 'dark' }}
            />
          </div>
        )}

        {/* Live time range display */}
        {timeMode === 'live' && (
          <div className="px-3 py-1 bg-panel/60 rounded border border-hairline">
            <span className="text-[11px] uppercase tracking-[0.16em] text-white/60">
              {timeRangeLabel}
            </span>
          </div>
        )}

{/* Connection Status - Now real */}
        <button
          onClick={handleConnectionToggle}
          className={`
   p-2 rounded transition-colors border
       ${isConnected 
     ? 'text-ops-green border-hairline hover:bg-ops-green/10' 
           : 'text-danger border-danger hover:bg-danger/10'
     }
  `}
      aria-label={isConnected ? 'Connected to backend - click to disconnect' : 'Disconnected - click to connect'}
        title={isConnected ? 'Backend connected (click to disconnect)' : 'Backend disconnected (click to reconnect)'}
>
          {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
 </button>

    {/* Command Palette */}
  <button
          onClick={onCommandPalette}
   className="flex items-center gap-2 px-3 py-1 bg-cyan/10 hover:bg-cyan/20 border border-cyan rounded transition-colors group"
     aria-label="Open command palette (Alt+Space)"
    title="Command Palette (Alt+Space)"
        >
<Terminal className="w-4 h-4 text-cyan" />
          <span className="text-xs text-cyan font-medium uppercase tracking-[0.14em]">Cmd</span>
          <kbd className="text-[10px] text-cyan/80 bg-ink/60 px-1.5 py-0.5 rounded border border-cyan/30">
            Alt+Space
      </kbd>
     </button>

        {/* Settings */}
  {onSettings && (
          <button
    onClick={onSettings}
  className="p-2 hover:bg-hairline border border-hairline rounded transition-colors"
 aria-label="Open settings"
    title="Settings"
          >
            <svg className="w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
     </button>
        )}
      </div>
    </header>
  );
}
