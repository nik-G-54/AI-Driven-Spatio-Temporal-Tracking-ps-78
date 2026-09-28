import type { DashboardOverview } from '../dashboard.api';

interface DashboardHeaderProps {
  overview: DashboardOverview;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function DashboardHeader({ overview, onRefresh, isRefreshing }: DashboardHeaderProps) {
  return (
    <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
      <div className="flex flex-col max-w-2xl">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[10px] font-label-sm text-[#1D4ED8] uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" />
            Operational Synoptic Workstation
          </span>
          <span className="text-[#94A3B8] font-mono text-code-sm">•</span>
          <span className="font-mono text-code-sm text-[#475569]">EPS Node: {overview.epsNode}</span>
        </div>
        <h1 className="text-display-md text-[#0F172A] tracking-tight">Extreme Weather Intelligence</h1>
        <p className="text-body-md text-[#475569] mt-1">
          Monitor evolving atmospheric anomalies and localized hazard footprints across active NWP ensemble cycles.
        </p>
      </div>

      <div className="flex items-center flex-wrap gap-2.5">
        <button
          type="button"
          className="h-9 px-3.5 bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] hover:bg-[#F8FAFC] shadow-sm flex items-center gap-2 font-mono text-code-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20"
        >
          <span className="material-symbols-outlined text-[16px] text-[#475569]">update</span>
          <span className="font-semibold text-[#0F172A]">{overview.cycle.label}</span>
          <span className="material-symbols-outlined text-[16px] text-[#76777D]">expand_more</span>
        </button>
        <button
          type="button"
          title="Refresh Live Data Feed"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="w-9 h-9 bg-white border border-[#CBD5E1] rounded-lg text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC] shadow-sm flex items-center justify-center transition-all focus:outline-none disabled:opacity-60"
        >
          <span className={`material-symbols-outlined text-[18px] ${isRefreshing ? 'animate-spin' : ''}`}>
            refresh
          </span>
        </button>
        <button
          type="button"
          className="h-9 px-4 bg-[#0F172A] text-white hover:bg-[#1E293B] rounded-lg shadow-sm flex items-center gap-2 text-label-md transition-all active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[18px] text-[#A5B4FC]">bolt</span>
          <span>Run Ad-hoc Downscaling</span>
        </button>
      </div>
    </section>
  );
}
