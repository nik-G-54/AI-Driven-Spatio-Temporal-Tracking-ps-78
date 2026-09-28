import type { ActiveAnomaly } from '../dashboard.api';
import AnomalyCard from './AnomalyCard';

interface ActiveTrackedAnomaliesProps {
  anomalies: ActiveAnomaly[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function ActiveTrackedAnomalies({ anomalies, selectedId, onSelect }: ActiveTrackedAnomaliesProps) {
  return (
    <div className="lg:col-span-4 bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex flex-col min-h-[580px]">
      <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
        <div className="flex items-center gap-2">
          <h2 className="text-headline-sm text-[#0F172A]">Active Tracked Anomalies</h2>
          <span className="px-2 py-0.5 rounded-full text-[10px] text-label-sm bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
            {anomalies.length} ACTIVE
          </span>
        </div>
        <span className="material-symbols-outlined text-[18px] text-[#475569] cursor-pointer hover:text-[#0F172A]">
          tune
        </span>
      </div>

      <div className="flex flex-col gap-3 mt-3 overflow-y-auto pr-0.5 flex-1">
        {anomalies.map((anomaly) => (
          <AnomalyCard
            key={anomaly.id}
            anomaly={anomaly}
            isSelected={anomaly.id === selectedId}
            onSelect={() => onSelect(anomaly.id)}
          />
        ))}
      </div>
    </div>
  );
}
