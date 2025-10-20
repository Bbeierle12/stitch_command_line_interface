import { NetworkCard } from "../components/NetworkCard";

export function NetworkPage() {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-cyan mb-4">Network Monitor</h2>
        <div className="grid gap-4">
          <NetworkCard />
          <div className="card-surface p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Active Connections</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-hairline/50">
                  <tr>
                    <th className="text-left py-2 text-white/50">Local Address</th>
                    <th className="text-left py-2 text-white/50">Remote Address</th>
                    <th className="text-left py-2 text-white/50">State</th>
                    <th className="text-right py-2 text-white/50">Protocol</th>
                  </tr>
                </thead>
                <tbody className="text-white/70">
                  <tr className="border-b border-hairline/30">
                    <td className="py-2">127.0.0.1:5173</td>
                    <td className="py-2">127.0.0.1:54321</td>
                    <td className="py-2"><span className="text-green-400">ESTABLISHED</span></td>
                    <td className="text-right">TCP</td>
                  </tr>
                  <tr className="border-b border-hairline/30">
                    <td className="py-2">192.168.1.100:443</td>
                    <td className="py-2">93.184.216.34:443</td>
                    <td className="py-2"><span className="text-green-400">ESTABLISHED</span></td>
                    <td className="text-right">TCP</td>
                  </tr>
                  <tr className="border-b border-hairline/30">
                    <td className="py-2">192.168.1.100:80</td>
                    <td className="py-2">10.0.0.1:80</td>
                    <td className="py-2"><span className="text-yellow-400">TIME_WAIT</span></td>
                    <td className="text-right">TCP</td>
                  </tr>
                  <tr className="border-b border-hairline/30">
                    <td className="py-2">0.0.0.0:8080</td>
                    <td className="py-2">*:*</td>
                    <td className="py-2"><span className="text-cyan">LISTENING</span></td>
                    <td className="text-right">TCP</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card-surface p-4">
              <h4 className="text-white/50 text-xs uppercase mb-2">Download</h4>
              <p className="text-2xl font-semibold text-cyan">1.2 MB/s</p>
            </div>
            <div className="card-surface p-4">
              <h4 className="text-white/50 text-xs uppercase mb-2">Upload</h4>
              <p className="text-2xl font-semibold text-cyan">384 KB/s</p>
            </div>
            <div className="card-surface p-4">
              <h4 className="text-white/50 text-xs uppercase mb-2">Latency</h4>
              <p className="text-2xl font-semibold text-green-400">12 ms</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
