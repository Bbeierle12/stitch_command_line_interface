import { useEffect, useState } from "react";
import { electronService } from "../services/electronService";

export function ElectronStatus() {
  const [isElectron, setIsElectron] = useState(false);
  const [platform, setPlatform] = useState<string | null>(null);

  useEffect(() => {
    const checkElectron = async () => {
      const isElectronApp = electronService.isElectronApp();
      setIsElectron(isElectronApp);
      
      if (isElectronApp) {
        setPlatform(electronService.getPlatform());
        
        // Test system info
        const sysInfo = await electronService.getSystemInfo();
        console.log('[Electron] System Info:', sysInfo);
      }
    };
    
    checkElectron();
  }, []);

  if (!isElectron) {
    return (
      <div className="fixed bottom-4 left-4 z-50 rounded border border-warn/30 bg-panel px-3 py-1.5 text-xs text-warn/70">
        <span className="mr-2">⚠</span>
        Running in browser mode
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 rounded border border-ops-green/30 bg-panel px-3 py-1.5 text-xs text-ops-green">
      <span className="mr-2">✓</span>
      Desktop mode • {platform}
    </div>
  );
}
