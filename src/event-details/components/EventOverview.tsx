import type { EventOverview as EventOverviewData } from '../event-details.api';
import { getVariantStyle } from '../event-details.utils';

interface EventOverviewProps {
  overview: EventOverviewData;
}

export default function EventOverview({ overview }: EventOverviewProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-[#EFF4FF] rounded-lg font-mono text-code-sm text-[#475569]">
      <div className="flex flex-wrap items-center gap-4">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#545F73]" />
          Target Domain: {overview.targetDomain}
        </span>
        <span>•</span>
        <span>Projection: {overview.projection}</span>
        <span>•</span>
        <span>
          Valid: +{overview.validLeadTimeHours}h Lead Time ({overview.validTimestampLabel})
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-label-sm uppercase text-[#475569]">Precipitation scale (mm/d):</span>
        <div className="flex items-center gap-1">
          {overview.precipitationScale.map((band) => {
            const style = getVariantStyle(band.variant);
            return (
              <span
                key={band.label}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${style.bg} ${style.text}`}
              >
                {band.label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
