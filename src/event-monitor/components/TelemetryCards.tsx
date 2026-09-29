import type { ApiEventDetails, ApiTelemetryResponse } from '../event-monitor.api';

interface TelemetryCardsProps {
  eventDetails: ApiEventDetails;
  telemetry: ApiTelemetryResponse;
}

export default function TelemetryCards({ eventDetails, telemetry }: TelemetryCardsProps) {
  const trend = eventDetails.maxWindSpeedKmph >= 120 ? 'INTENSIFYING' : eventDetails.maxWindSpeedKmph >= 70 ? 'STABLE' : 'WEAKENING';
  const trendColor = trend === 'INTENSIFYING' ? 'text-[#991b1b]' : trend === 'STABLE' ? 'text-[#c2410c]' : 'text-[#166534]';

  const landfallEtaText = eventDetails.estimatedLandfallTime
    ? new Date(eventDetails.estimatedLandfallTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC'
    : 'Open Water';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 my-4 font-mono">
      {/* CARD 1: CURRENT INTENSITY */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-[700] text-[#64748b] tracking-[0.04em] uppercase">
            CARD 1 • CURRENT INTENSITY
          </span>
          <span className="material-symbols-outlined text-[#4f46e5] text-[18px]">air</span>
        </div>
        <div className="mt-2.5 space-y-1">
          <div className="flex items-baseline justify-between">
            <span className="text-[12px] font-[500] text-[#64748b]">Max Wind:</span>
            <span className="text-[17px] font-[800] text-[#1e1b4b]">
              {eventDetails.maxWindSpeedKmph} <span className="text-[11px] font-[500] text-[#64748b]">km/h</span>
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-[12px] font-[500] text-[#64748b]">Pressure:</span>
            <span className="text-[17px] font-[800] text-[#1e1b4b]">
              {eventDetails.centralPressureHpa || telemetry.surfacePressureHpa} <span className="text-[11px] font-[500] text-[#64748b]">hPa</span>
            </span>
          </div>
        </div>
      </div>

      {/* CARD 2: MOVEMENT */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-[700] text-[#64748b] tracking-[0.04em] uppercase">
            CARD 2 • MOVEMENT
          </span>
          <span className="material-symbols-outlined text-[#166534] text-[18px]">navigation</span>
        </div>
        <div className="mt-2.5 space-y-1">
          <div className="flex items-baseline justify-between">
            <span className="text-[12px] font-[500] text-[#64748b]">Vector:</span>
            <span className="text-[17px] font-[800] text-[#1e1b4b]">
              {eventDetails.movementDirection} @ {eventDetails.forwardSpeedKmph} <span className="text-[11px] font-[500] text-[#64748b]">km/h</span>
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-[12px] font-[500] text-[#64748b]">Trend:</span>
            <span className={`text-[12px] font-[700] uppercase ${trendColor}`}>
              {trend}
            </span>
          </div>
        </div>
      </div>

      {/* CARD 3: NEXT CRITICAL WINDOW */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-[700] text-[#64748b] tracking-[0.04em] uppercase">
            CARD 3 • CRITICAL WINDOW
          </span>
          <span className="material-symbols-outlined text-[#991b1b] text-[18px]">schedule</span>
        </div>
        <div className="mt-2.5 space-y-1">
          <div className="flex items-baseline justify-between">
            <span className="text-[12px] font-[500] text-[#64748b]">Window:</span>
            <span className="text-[17px] font-[800] text-[#991b1b]">T+24h — T+36h</span>
          </div>
          <div className="text-[11px] font-[500] text-[#64748b] truncate">
            {eventDetails.estimatedLandfallLocation ? `${eventDetails.estimatedLandfallLocation} (${landfallEtaText})` : 'Open Water Trajectory'}
          </div>
        </div>
      </div>
    </div>
  );
}
