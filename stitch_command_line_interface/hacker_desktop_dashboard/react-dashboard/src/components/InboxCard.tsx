import { CardShell } from "./CardShell";

const notifications = [
  { id: "ci", bucket: "CI", text: "Pipeline main failed on lint stage", accent: "text-danger" },
  { id: "os", bucket: "OS", text: "Patch Tuesday bundle ready", accent: "text-warn" },
  { id: "ide", bucket: "IDE", text: "LLM draft plan ready for review", accent: "text-cyan" }
];

export function InboxCard() {
  return (
    <CardShell
      title="Notifications"
      actions={
        <div className="flex items-center gap-2 text-xs">
          <button className="rounded border border-hairline px-2 py-1 text-white/70 transition hover:border-cyan hover:text-cyan">
            Mute rule
          </button>
          <button className="rounded border border-hairline px-2 py-1 text-white/70 transition hover:border-cyan hover:text-cyan">
            Create task
          </button>
        </div>
      }
    >
      <ul className="space-y-3 text-xs text-white/70">
        {notifications.map((note) => (
          <li key={note.id} className="rounded border border-hairline/40 bg-ink/40 px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-white/40 uppercase tracking-[0.16em]">{note.bucket}</span>
              <span className={`text-right ${note.accent}`}>{note.text}</span>
            </div>
          </li>
        ))}
      </ul>
    </CardShell>
  );
}
