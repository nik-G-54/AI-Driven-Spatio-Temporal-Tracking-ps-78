import { useNavigate } from 'react-router-dom';
import type { ApiRiskAlertItem } from '../event-monitor.api';

interface RiskAlertsProps {
  alerts: ApiRiskAlertItem[];
  eventId: string;
}

export default function RiskAlerts({ alerts, eventId }: RiskAlertsProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5 space-y-3.5 font-mono">
      <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0]">
        <div>
          {/* Section Header Title (13px 700 Bold 0.04em UPPERCASE #1e1b4b) */}
          <h3 className="font-mono text-[13px] font-[700] tracking-[0.04em] uppercase text-[#1e1b4b]">
            DOWNSTREAM RISK ALERTS
          </h3>
        </div>
        <span className="material-symbols-outlined text-[#991b1b] text-[20px]">warning</span>
      </div>

      <div className="space-y-2.5 font-mono">
        {alerts.map((alert) => {
          const isExtreme = alert.severity_level.toUpperCase() === 'EXTREME' || alert.urgency_level.toUpperCase() === 'IMMEDIATE';

          return (
            <div
              key={alert.alert_id}
              onClick={() => navigate(`/event-details/${eventId}`)}
              className={`p-3.5 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
                isExtreme
                  ? 'bg-red-50/80 border-red-200 hover:border-red-400'
                  : 'bg-amber-50/80 border-amber-200 hover:border-amber-400'
              }`}
            >
              <div className="flex items-center justify-between">
                {/* Status Badges (11px 700 Bold 0.05em UPPERCASE) */}
                <span
                  className={`text-[11px] font-[700] tracking-[0.05em] px-2 py-0.5 rounded uppercase ${
                    isExtreme ? 'bg-[#991b1b] text-white' : 'bg-[#c2410c] text-white'
                  }`}
                >
                  {alert.severity_level} • {alert.event_code}
                </span>
                <span className="text-[11px] font-[500] text-[#64748b] flex items-center gap-1">
                  <span>Details</span>
                  <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                </span>
              </div>

              {/* Table / Cell Data (12px 700 Bold #0f172a) */}
              <div className="mt-2 font-[700] text-[12px] text-[#0f172a]">
                {alert.headline}
              </div>

              <div className="text-[11px] font-[500] text-[#64748b] mt-0.5">
                <span className="font-[700] text-[#1e1b4b]">Affected Sector:</span> {alert.area_description}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
