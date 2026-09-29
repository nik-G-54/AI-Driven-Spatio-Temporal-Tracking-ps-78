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
  return (
    <section className="flex flex-col gap-2 bg-white p-3 rounded-md border border-[#E2E8F0]" aria-label={title}>
      <div className="flex items-start justify-between gap-2 min-h-[38px]">
        <div>
          <h3 className="text-body-sm font-bold text-[#0F172A] tracking-wide">{title}</h3>
          <div className="text-[11px] text-[#475569]">{subtitle}</div>
        </div>
        {controls}
      </div>
      {children}
      {footer && <div className="text-[11px] text-[#334155] leading-snug">{footer}</div>}
    </section>
  );
}
