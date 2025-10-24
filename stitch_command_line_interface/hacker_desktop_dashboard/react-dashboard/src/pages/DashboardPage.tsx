import { LiveCodeEditor } from "../components/LiveCodeEditor";
import { MetricCard, MetricRow } from "../components/MetricCard";
import { PreviewState, CiState, SecState } from "../types";
import { 
  GitBranch, 
  Shield, 
  Cpu, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp
} from 'lucide-react';

type Metric = {
  label: string;
  value: string;
  accent?: string;
};

interface DashboardPageProps {
  previewState: PreviewState;
  ciState: CiState | null;
  secState: SecState | null;
  systemMetrics: Metric[] | null;
  onPreviewModeChange: (mode: any) => void;
}

export function DashboardPage({
previewState,
  ciState,
  secState,
  systemMetrics,
  onPreviewModeChange
}: DashboardPageProps) {
  return (
    <div className="h-full overflow-hidden flex gap-4 p-4">
      {/* Left Side - Live Code Editor */}
    <div className="flex-1 min-h-0 overflow-hidden">
        <LiveCodeEditor />
      </div>

      {/* Right Side - Metrics Dashboard */}
      <div className="w-80 flex-shrink-0 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-hairline scrollbar-track-transparent">
        {/* CI/CD Status */}
        {ciState && (
          <MetricCard 
            title="Build Status" 
            icon={GitBranch}
         accent={ciState.build.status === 'pass' ? 'green' : ciState.build.status === 'fail' ? 'danger' : 'warn'}
            loading={!ciState}
          >
         <div className="space-y-2">
     <div className="flex items-center gap-2">
       {ciState.build.status === 'pass' && <CheckCircle className="w-5 h-5 text-ops-green" />}
     {ciState.build.status === 'fail' && <XCircle className="w-5 h-5 text-danger" />}
             {ciState.build.status === 'running' && <Clock className="w-5 h-5 text-warn animate-pulse" />}
              <span className="text-sm font-medium capitalize">{ciState.build.status}</span>
              </div>
          
  <MetricRow 
    label="Duration" 
      value={`${ciState.build.durationMs}ms`}
  accent="default"
              />
    <MetricRow 
         label="Cache Hit" 
         value={`${ciState.build.cacheHitPct}%`}
     accent={ciState.build.cacheHitPct > 70 ? 'green' : 'warn'}
   />
       
              <div className="pt-2 border-t border-hairline mt-2">
                <div className="text-xs text-white/50 mb-2">Test Results</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
           <div className="bg-ops-green/10 border border-ops-green/30 rounded px-2 py-1">
            <div className="text-ops-green font-medium">{ciState.tests.pass}</div>
     <div className="text-white/50">Passed</div>
      </div>
      <div className="bg-danger/10 border border-danger/30 rounded px-2 py-1">
            <div className="text-danger font-medium">{ciState.tests.fail}</div>
         <div className="text-white/50">Failed</div>
           </div>
         <div className="bg-white/5 border border-hairline rounded px-2 py-1">
  <div className="text-white/70 font-medium">{ciState.tests.skip}</div>
         <div className="text-white/50">Skipped</div>
 </div>
 <div className="bg-warn/10 border border-warn/30 rounded px-2 py-1">
           <div className="text-warn font-medium">{ciState.tests.flaky}</div>
         <div className="text-white/50">Flaky</div>
        </div>
  </div>
      </div>
            </div>
          </MetricCard>
        )}

        {/* Security Status */}
    {secState && (
      <MetricCard 
            title="Security" 
     icon={Shield}
            accent={secState.alerts.some(a => a.sev === 'high') ? 'danger' : 'green'}
   loading={!secState}
          >
    <div className="space-y-2">
              <MetricRow 
   label="VPN" 
          value={secState.vpn.toUpperCase()}
 accent={secState.vpn === 'on' ? 'green' : 'danger'}
     />
              <MetricRow 
 label="Firewall" 
     value={secState.firewall.toUpperCase()}
        accent={secState.firewall === 'on' ? 'green' : 'danger'}
 />
              <MetricRow 
    label="Encryption" 
      value={secState.encryption.toUpperCase()}
     accent={secState.encryption === 'on' ? 'green' : 'danger'}
   />
    
          {secState.alerts.length > 0 && (
                <div className="pt-2 border-t border-hairline mt-2">
          <div className="flex items-center gap-1 text-xs text-white/50 mb-2">
            <AlertTriangle className="w-3 h-3" />
     <span>Active Alerts ({secState.alerts.length})</span>
      </div>
        <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-thin">
          {secState.alerts.map(alert => (
           <div 
           key={alert.id}
     className={`text-xs p-2 rounded border ${
   alert.sev === 'high' ? 'bg-danger/10 border-danger/30 text-danger' :
                alert.sev === 'med' ? 'bg-warn/10 border-warn/30 text-warn' :
        'bg-white/5 border-hairline text-white/70'
       }`}
        >
          <div className="font-medium">{alert.title}</div>
          <div className="text-white/40 text-[10px] mt-0.5">{alert.ageSec}s ago</div>
         </div>
           ))}
                  </div>
        </div>
         )}
          </div>
      </MetricCard>
 )}

        {/* System Metrics */}
        {systemMetrics && systemMetrics.length > 0 && (
     <MetricCard 
 title="System" 
            icon={Cpu}
  accent="cyan"
    loading={!systemMetrics}
       >
    <div className="space-y-2">
              {systemMetrics.map((metric, index) => (
     <MetricRow 
     key={index}
        label={metric.label}
           value={metric.value}
       accent={
      metric.label === 'Temp' && parseInt(metric.value) > 75 ? 'danger' :
         metric.label === 'CPU' && parseInt(metric.value) > 80 ? 'warn' :
                'default'
      }
           />
       ))}
         </div>
       </MetricCard>
  )}

        {/* Preview State */}
        <MetricCard 
    title="Preview" 
    icon={TrendingUp}
       accent={previewState.hmr.ok ? 'green' : 'danger'}
        >
     <div className="space-y-2">
      <MetricRow 
  label="Mode" 
      value={previewState.mode}
            />
      <MetricRow 
      label="HMR Status" 
     value={previewState.hmr.ok ? 'OK' : 'ERROR'}
              accent={previewState.hmr.ok ? 'green' : 'danger'}
        />
          <MetricRow 
            label="Last Update" 
              value={`${previewState.hmr.lastMs}ms`}
 accent={previewState.hmr.lastMs < 200 ? 'green' : previewState.hmr.lastMs < 500 ? 'warn' : 'danger'}
        />
      
            {previewState.mode === 'browser' && 'url' in previewState && (
              <div className="pt-2 border-t border-hairline mt-2">
       <div className="text-xs text-white/50 mb-1">URL</div>
    <div className="text-xs text-cyan break-all">{previewState.url}</div>
      </div>
      )}
          </div>
        </MetricCard>
      </div>
    </div>
  );
}
