import type { SelectedTarget } from '../dashboard.api';

interface SelectedTargetHudProps {
  target: SelectedTarget;
}

export default function SelectedTargetHud({ target }: SelectedTargetHudProps) {
  return (
    <div className="relative z-10 m-3 max-w-xs bg-[#0F172A]/90 backdrop-blur-md border border-[#334155] rounded-lg p-3 text-white shadow-xl pointer-events-auto">
      <div className="flex items-center justify-between text-[10px] text-label-sm pb-1.5 border-b border-[#334155]">
        <span className="text-[#94A3B8]">SELECTED TARGET</span>
        <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-[#FCA5A5] border border-red-500/40">
          {target.severity} TIER
        </span>
      </div>
      <div className="mt-2 text-headline-sm text-[13px] font-bold text-white flex items-center gap-1.5">
        <span className="material-symbols-outlined text-[16px] text-[#EF4444]">cyclone</span>
        {target.eventId} ({target.alertId})
      </div>
      <div className="mt-1 grid grid-cols-2 gap-2 text-[11px] font-mono">
        <div>
          <span className="text-[#64748B] block text-[9px]">CENTER</span>
          <span className="text-[#E2E8F0]">
            {target.center.latitude}°N, {target.center.longitude}°E
          </span>
        </div>
        <div>
          <span className="text-[#64748B] block text-[9px]">PEAK PRECIP</span>
          <span className="text-[#F87171] font-bold">
            {target.peakPrecipitation.value} {target.peakPrecipitation.unit}
          </span>
        </div>
        <div>
          <span className="text-[#64748B] block text-[9px]">WIND RADIUS</span>
          <span className="text-[#E2E8F0]">
            {target.windRadius.value} {target.windRadius.unit}
          </span>
        </div>
        <div>
          <span className="text-[#64748B] block text-[9px]">LEAD TIME</span>
          <span className="text-[#60A5FA]">{target.leadTime}</span>
        </div>
      </div>
    </div>
  );
}
