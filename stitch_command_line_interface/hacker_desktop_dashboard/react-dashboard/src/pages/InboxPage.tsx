import { InboxCard } from "../components/InboxCard";

export function InboxPage() {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-cyan mb-4">Inbox & Notifications</h2>
        <div className="grid gap-4">
          <InboxCard />
          <div className="card-surface p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-ink/40 rounded border border-hairline/50">
                <div className="w-2 h-2 rounded-full bg-cyan mt-2"></div>
                <div className="flex-1">
                  <p className="text-white/90">CI build completed successfully</p>
                  <p className="text-white/50 text-sm mt-1">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-ink/40 rounded border border-hairline/50">
                <div className="w-2 h-2 rounded-full bg-yellow-400 mt-2"></div>
                <div className="flex-1">
                  <p className="text-white/90">Security alert: New startup item detected</p>
                  <p className="text-white/50 text-sm mt-1">9 minutes ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-ink/40 rounded border border-hairline/50">
                <div className="w-2 h-2 rounded-full bg-red-400 mt-2"></div>
                <div className="flex-1">
                  <p className="text-white/90">Critical: Suspicious file quarantined</p>
                  <p className="text-white/50 text-sm mt-1">30 seconds ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-ink/40 rounded border border-hairline/50">
                <div className="w-2 h-2 rounded-full bg-cyan mt-2"></div>
                <div className="flex-1">
                  <p className="text-white/90">System update available</p>
                  <p className="text-white/50 text-sm mt-1">1 hour ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
