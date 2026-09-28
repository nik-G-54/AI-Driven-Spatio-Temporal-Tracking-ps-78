import type { DownstreamRiskAlert } from '../event-monitor.api';
import { getSeverityStyle } from '../event-monitor.utils';

interface DownstreamRiskAlertsProps {
  alerts: DownstreamRiskAlert[];
}

export default function DownstreamRiskAlerts({ alerts }: DownstreamRiskAlertsProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-2.5">
      <div className="text-headline-sm text-[#0F172A] font-bold flex items-center justify-between">
        <span>Downstream Risk Alerts</span>
        <span className="material-symbols-outlined text-[#BA1A1A] text-[18px]">warning</span>
      </div>
      <div className="flex flex-col gap-2 text-body-sm text-[12px]">
        {alerts.map((alert) => {
          const style = getSeverityStyle(alert.severity);
          return (
            <div key={alert.location} className="flex items-center justify-between p-2 rounded bg-[#EFF4FF]">
              <span className="font-medium text-[#0F172A]">{alert.location}</span>
              <span className="font-mono font-bold" style={{ color: style.accent }}>
                {alert.hazard}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
