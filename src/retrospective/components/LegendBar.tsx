import { gradientCss, legendTicks, thresholdAt, type ColorScale } from '../map/colorScales';

interface LegendBarProps {
  // What the colours encode, e.g. "Precipitation" or "AI refined − NWP".
  title: string;
  unit: string;
  scale: ColorScale;
  // Prototype threshold, shown only when the data contract exposes one.
  threshold?: { value: number; unit: string } | null;
  // Contour / outline styles that appear on the map(s) using this legend.
  outlines?: Array<{ label: string; dashed?: boolean }>;
  // Explains the track / centroid path when it is drawn.
  pathNote?: string | null;
  note?: string;
}

const fmt = (v: number) => (Math.abs(v) >= 100 ? String(Math.round(v)) : String(Number(v.toFixed(1))));

// Horizontal legend for the comparison and difference maps (dark workbench chrome).
export default function LegendBar({ title, unit, scale, threshold = null, outlines = [], pathNote = null, note }: LegendBarProps) {
  const ticks = legendTicks(scale, 8);
  const thr = threshold ? thresholdAt(scale, threshold.value) : null;
  return (
    <div className="flex flex-col gap-2 text-[#D9E1EA]">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-[12px] font-semibold">{title}</span>
          <span className="font-mono text-[10.5px] text-[#94A3B8]">{unit}</span>
        </div>
        <span className="font-mono text-[9px] tracking-[0.08em] px-1.5 py-[1px] border border-[#7A5A12] text-[#FBBF24]">SIMULATED</span>
        <div className="relative w-[320px] pt-1">
          <div className="h-2.5 border border-[#2A3645]" style={{ background: gradientCss(scale) }} />
          {thr !== null && <div className="absolute top-0 h-[18px] w-[2px] bg-[#FFBE28]" style={{ left: `calc(${thr}% - 1px)` }} />}
          <div className="relative h-3.5 mt-0.5 font-mono text-[9.5px] text-[#94A3B8]">
            {ticks.map((t) => (
              <span key={t.value} className="absolute -translate-x-1/2" style={{ left: `${t.at}%` }}>
                {fmt(t.value)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {(threshold || outlines.length > 0 || pathNote) && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[10.5px] text-[#B7C2CF]">
          {threshold && (
            <span>
              <strong className="text-[#E6EDF4] font-mono">Prototype threshold ≥ {threshold.value} {threshold.unit}</strong>
              <span className="text-[#7F8C9C]"> · not an official IMD threshold</span>
            </span>
          )}
          {outlines.map((o) => (
            <span key={o.label} className="flex items-center gap-1.5">
              <span className={o.dashed ? 'inline-block w-5 border-t-2 border-dashed border-[#ECF2F8]' : 'inline-block w-5 h-[2.5px] bg-[#FFBE28]'} />
              {o.label}
            </span>
          ))}
          {pathNote && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#38BDF8] border border-white" />
              {pathNote}
            </span>
          )}
        </div>
      )}
      {note && <div className="text-[10.5px] text-[#7F8C9C]">{note}</div>}
    </div>
  );
}
