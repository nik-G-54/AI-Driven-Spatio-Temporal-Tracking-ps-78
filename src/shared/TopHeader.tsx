import type { SystemStatus } from './shared.api';

interface TopHeaderProps {
  status: SystemStatus;
}

export default function TopHeader({ status }: TopHeaderProps) {
  const { header } = status;

  return (
    <header className="fixed top-0 left-[248px] right-0 h-[68px] bg-card border-b border-border z-40 px-6 flex items-center justify-between text-card-foreground">
      <div className="flex items-center gap-4 px-3 py-1.5 bg-muted/50 rounded border border-border">
        <div className="flex items-center gap-2 font-mono text-[11px] text-foreground">
          <span className="material-symbols-outlined text-[16px] text-muted-foreground">schedule</span>
          <span>
            Cycle: <strong className="font-semibold">{header.cycleLabel}</strong>
          </span>
        </div>
        <div className="h-3 w-px bg-border" />
        <div className="text-body-sm text-[11px] text-muted-foreground">
          Model: <span className="font-semibold text-foreground">{header.model}</span>
        </div>
        <span className="inline-flex items-center text-label-sm text-[10px] px-2 py-0.5 rounded bg-accent text-accent-foreground border border-border">
          {header.runStatus}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center gap-3 font-mono text-[11px]">
          <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {header.systemReady ? 'SYSTEM READY' : 'SYSTEM DEGRADED'}
          </span>
          <span className="text-muted-foreground">|</span>
          <span className="text-muted-foreground">{header.onlineNodes} Online</span>
          <span className="text-muted-foreground">|</span>
          <span className="text-primary font-semibold">Webhook: {header.webhookStatus}</span>
          <span className="text-muted-foreground">|</span>
          <span className="text-foreground font-semibold">Horizon: {header.horizon}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="h-8 px-2.5 rounded bg-card border border-border hover:bg-accent text-foreground text-label-md text-[11px] flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">refresh</span>
            Run Ingest
          </button>
          <button
            type="button"
            className="h-8 px-2.5 rounded bg-primary text-primary-foreground hover:opacity-90 text-label-md text-[11px] flex items-center gap-1 cursor-pointer font-medium"
          >
            <span className="material-symbols-outlined text-[15px]">bolt</span>
            Trigger AI
          </button>
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">person</span>
          </div>
        </div>
      </div>
    </header>
  );
}
