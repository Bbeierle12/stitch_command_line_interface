import { ReactNode } from "react";

type CardShellProps = {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function CardShell({ title, actions, children }: CardShellProps) {
  return (
    <section
      className="card-surface flex flex-col gap-4 p-4 transition-all duration-150 ease-glide hover:shadow-[0_4px_32px_rgba(0,233,255,0.1)]"
      aria-label={title}
      role="region"
    >
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-white/90 uppercase">
          {title}
        </h2>
        {actions ? <div className="flex items-center gap-2 text-xs" role="toolbar">{actions}</div> : null}
      </header>
      <div className="flex-1 min-h-0">{children}</div>
    </section>
  );
}
