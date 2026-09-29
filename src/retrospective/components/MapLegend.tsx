import { gradientCss, legendTicks, thresholdAt, type ColorScale } from '../map/colorScales';

interface MapLegendProps {
  // What the colours encode, e.g. "Precipitation" or "AI refined − NWP".
  title: string;
  unit: string;
  scale: ColorScale;
  // Prototype threshold shown only when the data contract exposes one.
  threshold: { value: number; unit: string } | null;
  showFootprint: boolean;
  footprintLabels: { primary: string; secondary: string | null };
  pathLabel?: string | null;
}

const fmt = (v: number) => (Math.abs(v) >= 100 ? String(Math.round(v)) : String(Number(v.toFixed(1))));

// Heads-up legend drawn over the single analytical map (bottom-left).
export default function MapLegend({ title, unit, scale, threshold, showFootprint, footprintLabels, pathLabel = null }: MapLegendProps) {
  const ticks = legendTicks(scale);
  const thr = threshold ? thresholdAt(scale, threshold.value) : null;
  return (
    <div className="absolute left-3 bottom-3 z-10 w-[300px] bg-[#05080C]/88 border border-[#2A3645] px-3 pt-2.5 pb-2 flex flex-col gap-2 text-[#D9E1EA] pointer-events-none">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="text-[12px] font-semibold truncate">{title}</span>
          <span className="font-mono text-[10.5px] text-[#94A3B8]">{unit}</span>
        </div>
        <span className="font-mono text-[9px] tracking-[0.08em] px-1.5 py-[1px] border border-[#7A5A12] text-[#FBBF24]">SIMULATED</span>
      </div>

      <div className="relative pt-1">
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

      {showFootprint && (
        <div className="flex flex-col gap-1 border-t border-[#1F2A36] pt-1.5 text-[10.5px] text-[#B7C2CF]">
          {threshold && (
            <div className="flex items-center gap-2">
              <span className="inline-block w-5 h-[2.5px] bg-[#FFBE28]" />
              <span>
                {footprintLabels.primary} · <span className="font-mono text-[#E6EDF4]">≥ {threshold.value} {threshold.unit}</span>
              </span>
            </div>
          )}
          {footprintLabels.secondary && (
            <div className="flex items-center gap-2">
              <span className="inline-block w-5 border-t-2 border-dashed border-[#ECF2F8]" />
              <span>{footprintLabels.secondary}</span>
            </div>
          )}
          {pathLabel && (
            <div className="flex items-center gap-2">
              <span className="relative inline-block w-5 h-[2px] bg-[#ECF2F8]">
                <span className="absolute -right-0.5 -top-[4px] w-2.5 h-2.5 rounded-full bg-[#38BDF8] border border-white" />
              </span>
              <span>{pathLabel}</span>
            </div>
          )}
          {threshold && <div className="text-[9.5px] text-[#7F8C9C]">Prototype threshold — not an official IMD criterion. Thin lines: isolines at the class breaks.</div>}
        </div>
      )}
    </div>
  );
}
