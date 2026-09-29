import type { ApiEventDetails, ApiDiagnosticsResponse } from '../event-monitor.api';

interface EventSnapshotProps {
  eventDetails: ApiEventDetails;
  diagnostics: ApiDiagnosticsResponse;
  severity: string;
}

export default function EventSnapshot({ eventDetails, diagnostics, severity }: EventSnapshotProps) {
  const isExtreme = severity.toUpperCase() === 'EXTREME' || severity.toUpperCase() === 'CRITICAL';
  const isHigh = severity.toUpperCase() === 'HIGH';

  const badgeBg = isExtreme
    ? 'bg-[#991b1b] text-white'
    : isHigh
    ? 'bg-[#c2410c] text-white'
    : 'bg-[#166534] text-white';

  const trackConfidencePercent = Math.round((diagnostics.gnnConfidenceScore || 0.94) * 100);

  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5 space-y-4 font-mono">
      {/* Section / Header Label (Indigo Mono Spec: 11px 700 Bold 0.04em UPPERCASE #64748b) */}
      <div className="flex items-start justify-between pb-3 border-b border-[#e2e8f0]">
        <div>
          <span className="font-mono text-[11px] font-[700] text-[#64748b] tracking-[0.04em] uppercase block">
            OPERATIONAL SNAPSHOT
          </span>
          {/* Card Value / Title (17px 800 ExtraBold #1e1b4b) */}
          <h2 className="font-mono text-[17px] font-[800] text-[#1e1b4b] tracking-tight mt-0.5">
            {eventDetails.name}
          </h2>
          <div className="font-mono text-[11px] font-[500] text-[#64748b]">{eventDetails.category}</div>
        </div>
        {/* Status Badge (11px 700 Bold 0.05em UPPERCASE) */}
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[11px] font-[700] tracking-[0.05em] uppercase shadow-xs ${badgeBg}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          {severity}
        </span>
      </div>

      {/* Primary Key Metrics Block */}
      <div className="bg-[#1e1b4b] text-white rounded-lg p-4 grid grid-cols-2 gap-3 font-mono">
        <div>
          <div className="text-[11px] font-[700] text-[#a5b4fc] tracking-[0.04em] uppercase">MAX WIND SPEED</div>
          <div className="text-[17px] font-[800] text-[#f87171] tracking-tight mt-0.5">
            {eventDetails.maxWindSpeedKmph} <span className="text-[11px] font-[500] text-[#e0e7ff]">km/h</span>
          </div>
        </div>
        <div>
          <div className="text-[11px] font-[700] text-[#a5b4fc] tracking-[0.04em] uppercase">CENTRAL PRESSURE</div>
          <div className="text-[17px] font-[800] text-[#38bdf8] tracking-tight mt-0.5">
            {eventDetails.centralPressureHpa} <span className="text-[11px] font-[500] text-[#e0e7ff]">hPa</span>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Grid */}
      <div className="grid grid-cols-2 gap-2.5 font-mono">
        <div className="bg-[#f8fafc] p-3 rounded-lg border border-[#e2e8f0]">
          <div className="text-[11px] font-[700] text-[#64748b] tracking-[0.04em] uppercase">Current Position</div>
          <div className="text-[12px] font-[500] text-[#0f172a] mt-0.5">
            {eventDetails.location.lat.toFixed(2)}°N, {eventDetails.location.lon.toFixed(2)}°E
          </div>
        </div>

        <div className="bg-[#f8fafc] p-3 rounded-lg border border-[#e2e8f0]">
          <div className="text-[11px] font-[700] text-[#64748b] tracking-[0.04em] uppercase">Movement</div>
          <div className="text-[12px] font-[500] text-[#0f172a] mt-0.5">
            {eventDetails.movementDirection} @ {eventDetails.forwardSpeedKmph} km/h
          </div>
        </div>

        <div className="bg-[#f8fafc] p-3 rounded-lg border border-[#e2e8f0]">
          <div className="text-[11px] font-[700] text-[#64748b] tracking-[0.04em] uppercase">Next Critical Window</div>
          <div className="text-[12px] font-[700] text-[#991b1b] mt-0.5">
            T+24h — Landfall
          </div>
        </div>

        <div className="bg-[#f8fafc] p-3 rounded-lg border border-[#e2e8f0]">
          <div className="text-[11px] font-[700] text-[#64748b] tracking-[0.04em] uppercase">Track Confidence</div>
          <div className="text-[12px] font-[700] text-[#166534] mt-0.5">
            {trackConfidencePercent}% High
          </div>
        </div>
      </div>
    </div>
  );
}
