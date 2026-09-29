import type { ColorScale } from '../map/colorScales';
import { rgbaCss } from '../map/colorScales';

interface MapLegendProps {
  // What the colours encode, e.g. "Precipitation" or "AI refined − NWP".
  title: string;
  unit: string;
  scale: ColorScale;
  // Prototype threshold shown only when the data contract exposes one.
  threshold: { value: number; unit: string } | null;
  showFootprint: boolean;
  footprintLabels: { primary: string; secondary: string | null };
}

export default function MapLegend({ title, unit, scale, threshold, showFootprint, footprintLabels }: MapLegendProps) {
  return (
    <div className="absolute left-3 bottom-3 z-10 w-[230px] rounded-lg bg-white/95 shadow-md border border-[#E2E8F0] p-3 flex flex-col gap-2 text-[#0F172A]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-body-sm font-semibold leading-tight">{title}</div>
          <div className="font-mono text-[11px] text-[#475569]">{unit}</div>
        </div>
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-[#A16207] font-semibold uppercase">Simulated</span>
      </div>

      <div className="flex flex-col gap-px">
        {[...scale.classes].reverse().map((c) => (
          <div key={c.label} className="flex items-center gap-2 text-[11px]">
            <span
              className="w-5 h-3 rounded-sm border border-[#CBD5E1]"
              style={{ background: c.color[3] === 0 ? 'repeating-linear-gradient(45deg,#fff,#fff 2px,#E2E8F0 2px,#E2E8F0 4px)' : rgbaCss(c.color) }}
            />
            <span className="font-mono text-[#334155]">{c.label}</span>
          </div>
        ))}
      </div>

      {showFootprint && (
        <div className="flex flex-col gap-1 border-t border-[#E2E8F0] pt-2 text-[11px] text-[#334155]">
          {threshold ? (
            <div>
              <strong>Prototype threshold: ≥ {threshold.value} {threshold.unit}</strong>
              <div className="text-[#64748B]">Not an official threshold.</div>
            </div>
          ) : (
            <div className="text-[#64748B]">No threshold available for this case.</div>
          )}
          <div className="flex items-center gap-2">
            <span className="inline-block w-5 border-t-2 border-[#111827]" />
            <span>{footprintLabels.primary}</span>
          </div>
          {footprintLabels.secondary && (
            <div className="flex items-center gap-2">
              <span className="inline-block w-5 border-t-2 border-dashed border-[#111827]" />
              <span>{footprintLabels.secondary}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-white border-2 border-[#111827]" />
            <span>Footprint centroid</span>
          </div>
        </div>
      )}
    </div>
  );
}
