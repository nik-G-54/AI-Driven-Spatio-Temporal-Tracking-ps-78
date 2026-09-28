import { useNavigate } from 'react-router-dom';
import type { ActiveAnomaly } from '../dashboard.api';
import { getSeverityStyle } from '../dashboard.utils';

interface DetectedEventsTableProps {
  anomalies: ActiveAnomaly[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function DetectedEventsTable({ anomalies, selectedId, onSelect }: DetectedEventsTableProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-card text-card-foreground border border-border rounded-lg shadow-xs flex flex-col overflow-hidden w-full">
      {/* Table Header Controls */}
      <div className="p-5 pb-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">table_chart</span>
            <h3 className="text-headline-sm text-foreground font-bold">Detected Anomaly Events</h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-accent text-accent-foreground border border-border">
              {anomalies.length} TRACKED
            </span>
          </div>
          <p className="text-body-sm text-muted-foreground mt-0.5">
            Operational event registry with lead time horizons and peak intensity telemetry
          </p>
        </div>
      </div>

      {/* Table Body */}
      {anomalies.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground text-body-md">
          No anomaly events available for this forecast run.
        </div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/60 text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Event ID</th>
                <th className="py-3 px-4 font-semibold">Anomaly & Type</th>
                <th className="py-3 px-4 font-semibold">Region & Coords</th>
                <th className="py-3 px-4 font-semibold">Severity</th>
                <th className="py-3 px-4 font-semibold">Lead Time</th>
                <th className="py-3 px-4 font-semibold">Peak Intensity</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-[13px]">
              {anomalies.map((anomaly) => {
                const isSelected = anomaly.id === selectedId;
                const style = getSeverityStyle(anomaly.severity);

                return (
                  <tr
                    key={anomaly.id}
                    onClick={() => onSelect(anomaly.id)}
                    className={`transition-colors cursor-pointer ${
                      isSelected ? 'bg-accent/60 font-medium' : 'hover:bg-muted/40'
                    }`}
                  >
                    {/* Event ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                      <div className="flex items-center gap-1.5">
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                        <span>{anomaly.id}</span>
                      </div>
                    </td>

                    {/* Anomaly Name & Type */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{anomaly.name}</span>
                        <span className="text-[11px] text-muted-foreground capitalize">{anomaly.type}</span>
                      </div>
                    </td>

                    {/* Region & Coords */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="text-foreground/90">{anomaly.region}</span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {anomaly.coordinates.latitude}°N, {anomaly.coordinates.longitude}°E
                        </span>
                      </div>
                    </td>

                    {/* Severity Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border ${style.badgeBg} ${style.badgeText} ${style.badgeBorder}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: style.dot }} />
                        {anomaly.severity}
                      </span>
                    </td>

                    {/* Lead Time */}
                    <td className="py-3.5 px-4 font-mono text-[12px] font-semibold text-foreground">
                      {anomaly.leadTime}
                    </td>

                    {/* Peak Intensity */}
                    <td className="py-3.5 px-4 font-mono text-[12px] text-muted-foreground">
                      <div className="flex flex-col gap-0.5">
                        {anomaly.peakRainfall && (
                          <span>Rain: <strong className="text-foreground">{anomaly.peakRainfall.value} {anomaly.peakRainfall.unit}</strong></span>
                        )}
                        {anomaly.maxWind && (
                          <span>Wind: <strong className="text-foreground">{anomaly.maxWind.value} {anomaly.maxWind.unit}</strong></span>
                        )}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/event-details/${anomaly.id}`);
                        }}
                        className="h-8 px-3 rounded bg-card border border-border text-foreground hover:bg-accent text-[12px] font-medium transition-colors inline-flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <span>Investigate</span>
                        <span className="material-symbols-outlined text-[16px] text-muted-foreground">arrow_forward</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
