interface MapLegendProps {
  projection: string;
  scale: string;
}

const RISK_LEGEND = [
  { label: 'LOW', color: '#22C55E' },
  { label: 'MOD', color: '#EAB308' },
  { label: 'HIGH', color: '#F97316' },
  { label: 'SEVERE', color: '#EF4444' },
  { label: 'EXTREME', color: '#B91C1C' },
];

export default function MapLegend({ projection, scale }: MapLegendProps) {
  return (
    <div className="relative z-10 m-3 bg-[#0F172A]/90 backdrop-blur-md border border-[#334155] rounded-lg px-3.5 py-2 text-white shadow-lg flex flex-wrap items-center justify-between gap-3 text-[11px] text-label-sm">
      <div className="flex items-center gap-2">
        <span className="text-[#94A3B8] text-label-sm text-[10px] uppercase">Anomaly Risk:</span>
        <div className="flex items-center gap-1.5">
          {RISK_LEGEND.map((item) => (
            <span key={item.label} className="inline-flex items-center gap-1 text-[10px]">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
          ))}
        </div>
      </div>
      <div className="h-3 w-px bg-[#334155] hidden sm:block" />
      <div className="flex items-center gap-3 text-[#CBD5E1] font-mono text-[10px]">
        <span className="flex items-center gap-1">
          <span className="text-[#38BDF8] font-bold">━━</span> Forecast Track
        </span>
        <span className="flex items-center gap-1">
          <span className="text-[#EF4444]">▒▒</span> 5 km Risk Cells
        </span>
        <span className="flex items-center gap-1">
          <span className="text-[#60A5FA]">╌╌</span> Ensemble 90% Cone
        </span>
      </div>
      <div className="h-3 w-px bg-[#334155] hidden sm:block" />
      <div className="font-mono text-[10px] text-[#94A3B8]">
        {projection} • {scale}
      </div>
    </div>
  );
}
