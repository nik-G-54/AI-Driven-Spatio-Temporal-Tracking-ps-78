import type { ReactNode } from 'react';

interface MapPanelProps {
  title: string;
  subtitle: string;
  controls?: ReactNode;
  // The map.
  children: ReactNode;
  // Text under the map (peak, footprint, reading guide, ...).
  footer?: ReactNode;
}

// Shared frame for the comparison and difference maps so all four have the same
// width and padding — a requirement for keeping their viewports identical.
export default function MapPanel({ title, subtitle, controls, children, footer }: MapPanelProps) {
  const simulated = /SIMULATED/.test(title);
  const name = title.replace(/\s*—\s*SIMULATED/, '');
  return (
    <section className="flex flex-col bg-[#0B1117] border border-[#1F2A36]" aria-label={title}>
      <div className="flex items-center justify-between gap-2 h-10 px-3 border-b border-[#1F2A36]">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="font-mono text-[11.5px] font-semibold tracking-[0.06em] text-[#E6EDF4] whitespace-nowrap">{name}</h3>
          {simulated ? (
            <span className="font-mono text-[9px] tracking-[0.08em] px-1.5 py-[1px] border border-[#7A5A12] text-[#FBBF24]">SIMULATED</span>
          ) : (
            <span className="font-mono text-[9px] tracking-[0.08em] px-1.5 py-[1px] border border-[#2B3846] text-[#9BA9B9]">INPUT</span>
          )}
          <span className="text-[11px] text-[#8794A4] truncate">{subtitle}</span>
        </div>
        {controls}
      </div>
      {children}
      {footer && <div className="px-3 py-2 text-[11px] text-[#B7C2CF] leading-snug border-t border-[#1F2A36]">{footer}</div>}
    </section>
  );
}
