import type { SystemStatus } from './shared.api';

interface TopHeaderProps {
  status: SystemStatus;
}

export default function TopHeader({ status }: TopHeaderProps) {
  const { header } = status;

  return (
    <header className="fixed top-0 left-[248px] right-0 h-[68px] bg-white border-b border-[#E2E8F0] z-40 px-6 flex items-center justify-between gap-4 whitespace-nowrap">
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex flex-col min-w-0">
          <div className="text-headline-sm text-[#0F172A] text-[14px] font-bold tracking-tight truncate">
            {header.title}
          </div>
          <div className="text-body-sm text-[#475569] text-[11px] truncate">{header.subtitle}</div>
        </div>
      </div>

      <div className="hidden xl:flex shrink-0 items-center gap-4 px-4 py-1.5 bg-[#F8FAFC] rounded border border-[#E2E8F0]">
        <div className="flex items-center gap-2 font-mono text-[11px] text-[#0F172A]">
          <span className="material-symbols-outlined text-[16px] text-[#475569]">schedule</span>
          <span>
            Cycle: <strong className="font-semibold">{header.cycleLabel}</strong>
          </span>
        </div>
        <div className="h-3 w-px bg-[#C6C6CD]" />
        <div className="text-body-sm text-[11px] text-[#475569]">
          Model: <span className="font-semibold text-[#0F172A]">{header.model}</span>
        </div>
        <span className="inline-flex items-center text-label-sm text-[10px] px-2 py-0.5 rounded bg-[#131B2E] text-[#DAE2FD] border border-[#565E74]/40">
          {header.runStatus}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <div className="hidden 2xl:flex items-center gap-3 font-mono text-[11px]">
          <span className="inline-flex items-center gap-1.5 text-[#16A34A] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
            {header.systemReady ? 'SYSTEM READY' : 'SYSTEM DEGRADED'}
          </span>
          <span className="text-[#475569]">|</span>
          <span className="text-[#475569]">{header.onlineNodes} Online</span>
          <span className="text-[#475569]">|</span>
          <span className="text-[#2563EB]">Webhook: {header.webhookStatus}</span>
          <span className="text-[#475569]">|</span>
          <span className="text-[#0F172A] font-semibold">Horizon: {header.horizon}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="h-8 px-2.5 rounded bg-white border border-[#CBD5E1] hover:bg-[#DCE9FF] text-[#0F172A] text-label-md text-[11px] flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[15px]">refresh</span>
            Run Ingest
          </button>
          <button
            type="button"
            className="h-8 px-2.5 rounded bg-black text-white hover:bg-[#1E293B] text-label-md text-[11px] flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[15px]">bolt</span>
            Trigger AI
          </button>
          <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[18px]">person</span>
          </div>
        </div>
      </div>
    </header>
  );
}
