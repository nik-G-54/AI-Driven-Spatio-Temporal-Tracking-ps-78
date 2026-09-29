import { useState, useMemo } from 'react';
import type { ActiveAnomaly } from '../dashboard.api';

interface DailyAnomalyAlertDensityProps {
  anomalies: ActiveAnomaly[];
}

interface AlertPoint {
  id: string;
  day: string;
  dayIndex: number;
  hour: string;
  hourIndex: number;
  name: string;
  type: string;
  severity: string;
  alertCount: number;
  peakInfo?: string;
  leadTime?: string;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const HOURS = [
  '12a', '1a', '2a', '3a', '4a', '5a', '6a', '7a', '8a', '9a', '10a', '11a',
  '12p', '1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '9p', '10p', '11p',
];

const SEVERITY_COLORS: Record<string, { bg: string; border: string; label: string }> = {
  MODERATE: { bg: '#F59E0B', border: '#D97706', label: 'Moderate' },
  HIGH: { bg: '#F97316', border: '#EA580C', label: 'High' },
  SEVERE: { bg: '#EF4444', border: '#DC2626', label: 'Severe' },
  EXTREME: { bg: '#A855F7', border: '#9333EA', label: 'Extreme' },
  DEFAULT: { bg: '#818CF8', border: '#6366F1', label: 'Normal' },
};

function getSeverityStyle(severity?: string) {
  const key = (severity || '').toUpperCase();
  return SEVERITY_COLORS[key] || SEVERITY_COLORS.DEFAULT;
}

export default function DailyAnomalyAlertDensity({ anomalies }: DailyAnomalyAlertDensityProps) {
  const [hoveredPoint, setHoveredPoint] = useState<AlertPoint | null>(null);

  // Map canonical anomaly events into the 7-day x 24-hour grid matrix
  const { pointsGrid } = useMemo(() => {
    const counts: Record<string, number> = { MODERATE: 0, HIGH: 0, SEVERE: 0, EXTREME: 0 };
    const matrix: Map<string, AlertPoint> = new Map();

    if (!anomalies || anomalies.length === 0) {
      return { pointsGrid: matrix };
    }

    anomalies.forEach((item, index) => {
      const sevKey = (item.severity || 'DEFAULT').toUpperCase();
      if (counts[sevKey] !== undefined) counts[sevKey]++;

      // Map lead time or landfall ETA to day index (0-6) and hour index (0-23)
      let dayIdx = index % 7;
      let hourIdx = 6; // default 6a

      if (item.leadTime) {
        const match = item.leadTime.match(/T\+(\d+)h/i);
        if (match) {
          const totalHours = parseInt(match[1], 10);
          dayIdx = Math.floor(totalHours / 24) % 7;
          hourIdx = totalHours % 24;
        }
      }

      const dayName = DAYS[dayIdx];
      const hourName = HOURS[hourIdx];
      const gridKey = `${dayIdx}-${hourIdx}`;

      const peakStr = item.peakRainfall
        ? `Rain: ${item.peakRainfall.value} ${item.peakRainfall.unit}`
        : item.maxWind
        ? `Wind: ${item.maxWind.value} ${item.maxWind.unit}`
        : undefined;

      const existing = matrix.get(gridKey);
      if (existing) {
        existing.alertCount += 1;
      } else {
        matrix.set(gridKey, {
          id: item.id,
          day: dayName,
          dayIndex: dayIdx,
          hour: hourName,
          hourIndex: hourIdx,
          name: item.name,
          type: item.type,
          severity: item.severity,
          alertCount: 1,
          peakInfo: peakStr,
          leadTime: item.leadTime,
        });
      }
    });

    return { pointsGrid: matrix };
  }, [anomalies]);

  return (
    <div className="bg-card text-card-foreground border border-border rounded-lg p-5 shadow-xs flex flex-col justify-between w-full select-none transition-colors duration-200">
      {/* 1. Header with Title & Top-Right Chart Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3.5 border-b border-border">
        <div>
          <h2 className="text-headline-sm text-foreground font-bold tracking-tight">
            Severity Distribution
          </h2>
        </div>

        {/* Top-Right Chart Legend */}
        <div className="flex items-center flex-wrap gap-4 text-xs font-medium text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
            <span>Moderate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]" />
            <span>High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
            <span>Severe</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#A855F7]" />
            <span>Extreme</span>
          </div>
        </div>
      </div>

      {/* 2. Grid Chart Matrix (7 Days x 24 Hours) */}
      <div className="mt-5 overflow-x-auto w-full">
        <div className="min-w-[850px] flex flex-col gap-3.5 font-mono">
          {DAYS.map((dayName, dayIdx) => (
            <div key={dayName} className="flex items-center w-full">
              {/* Day Label on Left Y-Axis */}
              <div className="w-24 text-right pr-4 text-xs font-semibold text-foreground shrink-0">
                {dayName}
              </div>

              {/* Horizontal Axis Baseline with Ticks & Bubbles */}
              <div className="relative flex-1 h-9 flex items-center">
                {/* Horizontal Baseline line */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-border" />

                {/* 24 Hourly Tick Columns */}
                <div className="w-full grid grid-cols-24 relative z-10 h-full">
                  {HOURS.map((hourName, hourIdx) => {
                    const gridKey = `${dayIdx}-${hourIdx}`;
                    const point = pointsGrid.get(gridKey);
                    const sevStyle = point ? getSeverityStyle(point.severity) : null;

                    // Compute bubble radius size based on alert count (8px to 16px)
                    const sizePx = point
                      ? Math.min(17, 8 + (point.alertCount - 1) * 3.5)
                      : 0;

                    return (
                      <div
                        key={hourName}
                        className="relative flex items-center justify-center h-full group cursor-pointer"
                        onMouseEnter={() => point && setHoveredPoint(point)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      >
                        {/* Vertical Tick Mark | */}
                        <div className="absolute bottom-0 w-[1px] h-2 bg-muted-foreground/30" />

                        {/* Bubble */}
                        {point && sevStyle && (
                          <div
                            className="rounded-full transition-transform duration-200 group-hover:scale-125 shadow-xs flex items-center justify-center"
                            style={{
                              width: `${sizePx * 2}px`,
                              height: `${sizePx * 2}px`,
                              backgroundColor: sevStyle.bg,
                              boxShadow: `0 0 8px ${sevStyle.bg}60`,
                              border: `1.5px solid ${sevStyle.border}`,
                            }}
                          />
                        )}

                        {/* Hover Floating Tooltip Card */}
                        {point && hoveredPoint?.id === point.id && (
                          <div className="absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 z-50 pointer-events-none whitespace-nowrap bg-popover text-popover-foreground border border-border shadow-xl rounded-lg p-3 font-mono text-xs flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: sevStyle?.bg }}
                              />
                              <span className="font-bold text-foreground">{point.name}</span>
                              <span
                                className="px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0"
                                style={{
                                  backgroundColor: sevStyle?.bg + '20',
                                  color: sevStyle?.bg,
                                  border: `1px solid ${sevStyle?.border}`,
                                }}
                              >
                                {point.severity}
                              </span>
                            </div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-3">
                              <span>Time: <strong className="text-foreground">{point.day} {point.hour}</strong></span>
                              <span>Horizon: <strong className="text-amber-500">{point.leadTime}</strong></span>
                            </div>
                            {point.peakInfo && (
                              <div className="text-[11px] text-muted-foreground border-t border-border/60 pt-1 mt-0.5">
                                Peak: <strong className="text-foreground">{point.peakInfo}</strong>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}

          {/* X-Axis Bottom Hour Labels (12a .. 11p) */}
          <div className="flex items-center w-full pt-1">
            <div className="w-24 shrink-0" />
            <div className="w-full grid grid-cols-24 text-center text-[10px] text-muted-foreground font-mono">
              {HOURS.map((h) => (
                <div key={h} className="truncate">
                  {h}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
