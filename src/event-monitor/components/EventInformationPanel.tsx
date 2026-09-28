import { Link } from 'react-router-dom';
import type {
  EventDiagnostics as EventDiagnosticsData,
  IntensityDistribution as IntensityDistributionData,
  MonitoredEvent,
} from '../event-monitor.api';
import { getSeverityStyle } from '../event-monitor.utils';
import EventMetrics from './EventMetrics';
import EventDiagnostics from './EventDiagnostics';
import IntensityDistribution from './IntensityDistribution';

interface EventInformationPanelProps {
  event: MonitoredEvent;
  diagnostics: EventDiagnosticsData;
  intensityDistribution: IntensityDistributionData;
  onExportGeoJson: () => void;
}

export default function EventInformationPanel({
  event,
  diagnostics,
  intensityDistribution,
  onExportGeoJson,
}: EventInformationPanelProps) {
  const severityStyle = getSeverityStyle(event.severity);

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 space-y-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-label-sm font-bold text-[#565E74] tracking-widest uppercase">
            Atmospheric Anomaly
          </span>
          <span
            className="inline-flex items-center gap-1 text-label-sm px-2.5 py-0.5 rounded-full text-white font-semibold"
            style={{ backgroundColor: severityStyle.accent }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            {event.severity} HAZARD
          </span>
        </div>
        <div>
          <h2 className="text-headline-lg text-[#0F172A] font-bold tracking-tight">{event.name}</h2>
          <div className="text-body-sm text-[#475569] mt-0.5">{event.classification}</div>
        </div>
      </div>

      <EventMetrics event={event} />
      <EventDiagnostics diagnostics={diagnostics} />
      <IntensityDistribution distribution={intensityDistribution} />

      <div className="flex flex-col gap-2 pt-2">
        <Link
          to="/event-details"
          className="w-full py-2.5 px-4 rounded-lg bg-black text-white hover:bg-[#213145] text-label-md font-semibold shadow-sm flex items-center justify-center gap-2 transition-all"
        >
          <span>Open Downscaling &amp; Risk Details</span>
          <span className="material-symbols-outlined text-[16px]">open_in_new</span>
        </Link>
        <button
          type="button"
          onClick={onExportGeoJson}
          className="w-full py-2 px-4 rounded-lg bg-white text-[#0F172A] hover:bg-[#E5EEFF] text-label-md font-medium shadow-sm flex items-center justify-center gap-2 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px] text-[#565E74]">download</span>
          <span>Export Trajectory GeoJSON</span>
        </button>
      </div>

      <div className="p-2.5 rounded bg-[#EFF4FF] text-[#475569] font-mono text-[10px] flex items-start gap-2 leading-relaxed">
        <span className="material-symbols-outlined text-[14px] text-[#545F73] mt-0.5">info</span>
        <div>
          <strong className="font-semibold text-[#0F172A]">DEMO / SIMULATION NOTE:</strong> {diagnostics.simulationNote}
        </div>
      </div>
    </div>
  );
}
