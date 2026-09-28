import type { MonitoredEvent } from '../event-monitor.api';
import { formatCoordinate } from '../event-monitor.utils';

interface EventMetricsProps {
  event: MonitoredEvent;
}

export default function EventMetrics({ event }: EventMetricsProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5 pt-1">
      <div className="bg-[#EFF4FF] p-3 rounded-lg flex flex-col justify-between">
        <div className="text-label-sm text-[#475569] uppercase tracking-wider font-semibold">Current Coord</div>
        <div className="my-1">
          <div className="text-headline-sm text-[#0F172A] font-bold tracking-tight">
            {formatCoordinate(event.currentPosition)}
          </div>
        </div>
        <div className="font-mono text-[11px] text-[#475569]">
          Central pressure {event.centralPressure.value} {event.centralPressure.unit}
        </div>
      </div>

      <div className="bg-[#EFF4FF] p-3 rounded-lg flex flex-col justify-between">
        <div className="text-label-sm text-[#475569] uppercase tracking-wider font-semibold">Peak Intensity</div>
        <div className="my-1">
          <div className="text-[22px] text-[#BA1A1A] font-bold leading-tight">
            {event.intensity.peakRainfall} <span className="text-body-sm font-normal text-[#475569]">{event.intensity.rainfallUnit}</span>
          </div>
        </div>
        <div className="font-mono text-[11px] text-[#BA1A1A]">Severe localized rainfall</div>
      </div>

      <div className="bg-[#EFF4FF] p-3 rounded-lg flex flex-col justify-between">
        <div className="text-label-sm text-[#475569] uppercase tracking-wider font-semibold">Forecast Lead</div>
        <div className="my-1">
          <div className="text-headline-sm text-[#0F172A] font-bold tracking-tight">{event.forecast.leadHours} HOURS</div>
        </div>
        <div className="font-mono text-[11px] text-[#475569]">Landfall ETA: {event.forecast.landfallEta}</div>
      </div>

      <div className="bg-[#EFF4FF] p-3 rounded-lg flex flex-col justify-between">
        <div className="text-label-sm text-[#475569] uppercase tracking-wider font-semibold">Track Confidence</div>
        <div className="my-1">
          <div className="text-headline-sm text-black font-bold tracking-tight">{event.trackConfidence}%</div>
        </div>
        <div className="font-mono text-[11px] text-[#475569]">High ensemble convergence</div>
      </div>
    </div>
  );
}
