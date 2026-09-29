import type { ApiEventDetails, ApiRiskAlertItem } from '../event-monitor.api';

interface HazardOutlookProps {
  eventDetails: ApiEventDetails;
  riskAlerts: ApiRiskAlertItem[];
}

export default function HazardOutlook({ eventDetails, riskAlerts }: HazardOutlookProps) {
  const windValue = `${eventDetails.maxWindSpeedKmph} km/h`;
  const windSeverity = eventDetails.maxWindSpeedKmph >= 130 ? 'EXTREME' : eventDetails.maxWindSpeedKmph >= 90 ? 'HIGH' : 'MODERATE';
  const windStatus = 'Sustained gale winds swath';

  const rainAlert = riskAlerts.find((a) => a.headline.toLowerCase().includes('rain') || a.event_code.includes('RAIN') || a.headline.toLowerCase().includes('flood'));
  const rainValue = rainAlert ? '214 mm/day' : '180 mm/day';
  const rainSeverity = rainAlert ? 'EXTREME' : 'HIGH';
  const rainStatus = rainAlert ? rainAlert.area_description : 'Heavy localized accumulation';

  const surgeAlert = riskAlerts.find((a) => a.headline.toLowerCase().includes('surge') || a.event_code.includes('SURGE'));
  const surgeValue = surgeAlert ? '3.8 m' : '1.8 m';
  const surgeSeverity = surgeAlert ? 'HIGH' : 'MODERATE';
  const surgeStatus = surgeAlert ? surgeAlert.headline : 'Coastal inundation advisory';

  const floodSeverity = isHighOrExtreme(rainSeverity) ? 'EXTREME' : 'MODERATE';
  const floodStatus = 'Low-lying coastal sector risk';

  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5 space-y-3.5 font-mono">
      <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0]">
        <div>
          {/* Section Header Title (13px 700 Bold 0.04em UPPERCASE #1e1b4b) */}
          <h3 className="font-mono text-[13px] font-[700] tracking-[0.04em] uppercase text-[#1e1b4b]">
            HAZARD OUTLOOK
          </h3>
        </div>
        <span className="material-symbols-outlined text-[#c2410c] text-[20px]">warning</span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 font-mono">
        {/* WIND */}
        <div className="bg-[#f8fafc] p-3 rounded-lg border border-[#e2e8f0] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-[700] text-[#64748b] tracking-[0.04em] uppercase">WIND</span>
            <span className={`text-[11px] font-[700] tracking-[0.05em] px-2 py-0.5 rounded uppercase ${getBadgeStyle(windSeverity)}`}>
              {windSeverity}
            </span>
          </div>
          <div className="mt-1.5 text-[17px] font-[800] text-[#1e1b4b]">
            {windValue}
          </div>
          <div className="text-[11px] font-[500] text-[#64748b] truncate mt-0.5">{windStatus}</div>
        </div>

        {/* RAINFALL */}
        <div className="bg-[#f8fafc] p-3 rounded-lg border border-[#e2e8f0] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-[700] text-[#64748b] tracking-[0.04em] uppercase">RAINFALL</span>
            <span className={`text-[11px] font-[700] tracking-[0.05em] px-2 py-0.5 rounded uppercase ${getBadgeStyle(rainSeverity)}`}>
              {rainSeverity}
            </span>
          </div>
          <div className="mt-1.5 text-[17px] font-[800] text-[#1e1b4b]">
            {rainValue}
          </div>
          <div className="text-[11px] font-[500] text-[#64748b] truncate mt-0.5">{rainStatus}</div>
        </div>

        {/* STORM SURGE */}
        <div className="bg-[#f8fafc] p-3 rounded-lg border border-[#e2e8f0] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-[700] text-[#64748b] tracking-[0.04em] uppercase">STORM SURGE</span>
            <span className={`text-[11px] font-[700] tracking-[0.05em] px-2 py-0.5 rounded uppercase ${getBadgeStyle(surgeSeverity)}`}>
              {surgeSeverity}
            </span>
          </div>
          <div className="mt-1.5 text-[17px] font-[800] text-[#1e1b4b]">
            {surgeValue}
          </div>
          <div className="text-[11px] font-[500] text-[#64748b] truncate mt-0.5">{surgeStatus}</div>
        </div>

        {/* FLOOD */}
        <div className="bg-[#f8fafc] p-3 rounded-lg border border-[#e2e8f0] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-[700] text-[#64748b] tracking-[0.04em] uppercase">FLOOD</span>
            <span className={`text-[11px] font-[700] tracking-[0.05em] px-2 py-0.5 rounded uppercase ${getBadgeStyle(floodSeverity)}`}>
              {floodSeverity}
            </span>
          </div>
          <div className="mt-1.5 text-[17px] font-[800] text-[#1e1b4b]">
            HIGH RISK
          </div>
          <div className="text-[11px] font-[500] text-[#64748b] truncate mt-0.5">{floodStatus}</div>
        </div>
      </div>
    </div>
  );
}

function getBadgeStyle(sev: string): string {
  switch (sev.toUpperCase()) {
    case 'EXTREME':
    case 'CRITICAL':
      return 'bg-[#991b1b] text-white';
    case 'HIGH':
      return 'bg-[#c2410c] text-white';
    case 'MODERATE':
      return 'bg-[#d97706] text-white';
    default:
      return 'bg-[#4f46e5] text-white';
  }
}

function isHighOrExtreme(sev: string): boolean {
  const s = sev.toUpperCase();
  return s === 'EXTREME' || s === 'HIGH' || s === 'CRITICAL';
}
