import type { MapLegendItem } from '../historical-replay.api';

interface ReplayMapLegendProps {
  legend: MapLegendItem[];
}

export default function ReplayMapLegend({ legend }: ReplayMapLegendProps) {
  return (
    <div className="flex items-center gap-3 bg-[#EFF4FF] px-3 py-1.5 rounded font-mono text-code-sm">
      {legend.map((item) => (
        <div key={item.id} className="flex items-center gap-1.5">
          <span
            className={item.type === 'area' ? 'w-3 h-2 rounded opacity-80 inline-block' : 'w-2.5 h-2.5 rounded-full inline-block'}
            style={{ backgroundColor: item.color }}
          />
          <span className="font-semibold" style={{ color: item.type === 'area' ? '#475569' : item.color }}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
