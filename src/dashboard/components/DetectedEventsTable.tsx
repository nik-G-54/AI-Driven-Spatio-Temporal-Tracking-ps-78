import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ActiveAnomaly } from '../dashboard.api';
import { getSeverityStyle } from '../dashboard.utils';

interface DetectedEventsTableProps {
  anomalies: ActiveAnomaly[];
  selectedId: string;
  onSelect: (id: string) => void;
}

// Operational attention severity rank
function getSeverityRank(sev?: string): number {
  const s = (sev || '').toUpperCase();
  if (s === 'EXTREME' || s === 'SEVERE') return 1;
  if (s === 'HIGH') return 2;
  if (s === 'MODERATE') return 3;
  return 4;
}

// Extract numerical forecast lead time hours for sorting
function getLeadHours(str?: string): number {
  if (!str) return 999;
  const match = str.match(/T\+(\d+)h/i);
  return match ? parseInt(match[1], 10) : 999;
}

// Format raw anomaly type strings (e.g. "moisture-surge" -> "Moisture Surge")
function formatAnomalyType(rawType?: string): string {
  if (!rawType) return 'Other';
  return rawType
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function DetectedEventsTable({ anomalies, selectedId, onSelect }: DetectedEventsTableProps) {
  const navigate = useNavigate();

  // Sort anomalies by operational priority: Severity tier first, then nearest Risk Window
  const sortedAnomalies = useMemo(() => {
    if (!anomalies) return [];
    return [...anomalies].sort((a, b) => {
      const rankA = getSeverityRank(a.severity);
      const rankB = getSeverityRank(b.severity);
      if (rankA !== rankB) return rankA - rankB;
      return getLeadHours(a.leadTime) - getLeadHours(b.leadTime);
    });
  }, [anomalies]);

  return (
    <div className="bg-card text-card-foreground border border-border rounded-lg shadow-xs flex flex-col overflow-hidden w-full transition-colors duration-200">
      {/* Section Header */}
      <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/30">
        <div>
          <h3 className="text-headline-sm text-foreground font-bold">Priority Events</h3>
        </div>
      </div>

      {/* Table Body / Empty State */}
      {sortedAnomalies.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center">
          <h4 className="text-body-md font-bold text-foreground">No priority events</h4>
          <p className="text-body-sm text-muted-foreground mt-1">
            No upcoming anomaly events currently require elevated attention.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-border bg-muted text-[13px] font-mono text-foreground uppercase tracking-wider font-bold">
                <th className="py-3.5 px-4 font-bold text-foreground">Event</th>
                <th className="py-3.5 px-4 font-bold text-foreground">Type</th>
                <th className="py-3.5 px-4 font-bold text-foreground">Severity</th>
                <th className="py-3.5 px-4 font-bold text-foreground">Risk Window</th>
                <th className="py-3.5 px-4 font-bold text-foreground">Region</th>
                <th className="py-3.5 px-4 font-bold text-foreground text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-[13px]">
              {sortedAnomalies.map((anomaly) => {
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
                    {/* Column 1: Event (ID) */}
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                      <div className="flex items-center gap-1.5">
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                        <span>{anomaly.id}</span>
                      </div>
                    </td>

                    {/* Column 2: Type */}
                    <td className="py-3.5 px-4 font-medium text-foreground">
                      {formatAnomalyType(anomaly.type)}
                    </td>

                    {/* Column 3: Severity */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border ${style.badgeBg} ${style.badgeText} ${style.badgeBorder}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: style.dot }} />
                        {anomaly.severity}
                      </span>
                    </td>

                    {/* Column 4: Risk Window */}
                    <td className="py-3.5 px-4 font-mono text-[12px] font-semibold text-foreground">
                      {anomaly.leadTime}
                    </td>

                    {/* Column 5: Region */}
                    <td className="py-3.5 px-4 text-foreground/90 font-medium">
                      {anomaly.region}
                    </td>

                    {/* Column 6: Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        aria-label={`Investigate event ${anomaly.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/event-details/${anomaly.id}`);
                        }}
                        className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
                      >
                        <span>Investigate</span>
                        <span aria-hidden="true">&rarr;</span>
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
