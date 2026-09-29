import type { ColorScale } from '../map/colorScales';
import { rgbaCss } from '../map/colorScales';

interface LegendBarProps {
  // What the colours encode, e.g. "Precipitation" or "AI refined − NWP".
  title: string;
  unit: string;
  scale: ColorScale;
  // Prototype threshold, shown only when the data contract exposes one.
  threshold?: { value: number; unit: string } | null;
  // Footprint outline styles that appear on the map(s) using this legend.
  outlines?: Array<{ label: string; dashed?: boolean }>;
  // Explains the small circles/line when the centroid path is drawn.
  pathNote?: string | null;
  note?: string;
}

// Horizontal legend for the comparison and difference maps.
export default function LegendBar({ title, unit, scale, threshold = null, outlines = [], pathNote = null, note }: LegendBarProps) {
  return (
    <div className="flex flex-col gap-2 text-[#0F172A]">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-body-sm font-semibold">{title}</span>
          <span className="font-mono text-[11px] text-[#475569]">{unit}</span>
        </div>
        <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-amber-100 text-[#A16207] font-semibold uppercase">Simulated</span>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {scale.classes.map((c) => (
            <span key={c.label} className="flex items-center gap-1 text-[11px]">
              <span
                className="w-4 h-3 border border-[#CBD5E1]"
                style={{ background: c.color[3] === 0 ? 'repeating-linear-gradient(45deg,#fff,#fff 2px,#E2E8F0 2px,#E2E8F0 4px)' : rgbaCss(c.color) }}
              />
              <span className="font-mono text-[#334155]">{c.label}</span>
            </span>
          ))}
        </div>
      </div>

      {(threshold || outlines.length > 0 || pathNote) && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-[#334155]">
          {threshold && (
            <span>
              <strong>Prototype threshold: ≥ {threshold.value} {threshold.unit}</strong>
              <span className="text-[#64748B]"> · Not an official IMD threshold</span>
            </span>
          )}
          {outlines.map((o) => (
            <span key={o.label} className="flex items-center gap-1.5">
              <span className={`inline-block w-5 border-t-2 border-[#111827] ${o.dashed ? 'border-dashed' : ''}`} />
              {o.label}
            </span>
          ))}
          {pathNote && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-white border-2 border-[#111827]" />
              {pathNote}
            </span>
          )}
        </div>
      )}
      {note && <div className="text-[11px] text-[#64748B]">{note}</div>}
    </div>
  );
}
