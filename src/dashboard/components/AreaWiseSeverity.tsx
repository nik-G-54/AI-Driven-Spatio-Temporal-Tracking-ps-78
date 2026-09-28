import { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { ActiveAnomaly } from '../dashboard.api';

interface AreaWiseSeverityProps {
  anomalies: ActiveAnomaly[];
}

interface AreaSeverityItem {
  area: string;
  low: number;
  moderate: number;
  high: number;
  severe: number;
  total: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: AreaSeverityItem;
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;

    return (
      <div className="bg-popover text-popover-foreground text-[12px] font-mono px-3.5 py-2.5 rounded-lg shadow-md border border-border flex flex-col gap-1.5 min-w-[170px]">
        <div className="font-bold border-b border-border pb-1 text-foreground flex items-center justify-between">
          <span>{data.area}</span>
          <span className="text-primary text-[11px]">{data.total} Total</span>
        </div>
        <div className="flex flex-col gap-1 pt-0.5">
          {data.severe > 0 && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-red-500 font-semibold">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Severe
              </span>
              <span className="font-bold text-foreground">{data.severe} {data.severe === 1 ? 'event' : 'events'}</span>
            </div>
          )}
          {data.high > 0 && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-orange-500 font-semibold">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                High
              </span>
              <span className="font-bold text-foreground">{data.high} {data.high === 1 ? 'event' : 'events'}</span>
            </div>
          )}
          {data.moderate > 0 && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-amber-500 font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Moderate
              </span>
              <span className="font-bold text-foreground">{data.moderate} {data.moderate === 1 ? 'event' : 'events'}</span>
            </div>
          )}
          {data.low > 0 && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-500 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Low
              </span>
              <span className="font-bold text-foreground">{data.low} {data.low === 1 ? 'event' : 'events'}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
}

export default function AreaWiseSeverity({ anomalies }: AreaWiseSeverityProps) {
  const { chartData, hasData, totalEvents } = useMemo(() => {
    if (!anomalies || anomalies.length === 0) {
      return { chartData: [], hasData: false, totalEvents: 0 };
    }

    const areaMap: Record<string, { low: number; moderate: number; high: number; severe: number }> = {};

    for (const item of anomalies) {
      const region = item.region || 'Unspecified Area';
      if (!areaMap[region]) {
        areaMap[region] = { low: 0, moderate: 0, high: 0, severe: 0 };
      }

      const sev = (item.severity || '').toLowerCase();
      if (sev === 'severe' || sev === 'extreme') {
        areaMap[region].severe += 1;
      } else if (sev === 'high') {
        areaMap[region].high += 1;
      } else if (sev === 'moderate') {
        areaMap[region].moderate += 1;
      } else {
        areaMap[region].low += 1;
      }
    }

    const data: AreaSeverityItem[] = Object.entries(areaMap).map(([area, counts]) => ({
      area,
      low: counts.low,
      moderate: counts.moderate,
      high: counts.high,
      severe: counts.severe,
      total: counts.low + counts.moderate + counts.high + counts.severe,
    }));

    // Sort areas descending by total anomaly burden
    data.sort((a, b) => b.total - a.total);

    return {
      chartData: data,
      hasData: data.length > 0,
      totalEvents: anomalies.length,
    };
  }, [anomalies]);

  return (
    <div className="bg-card text-card-foreground border border-border rounded-lg p-5 shadow-xs flex flex-col justify-between w-full min-h-[420px] transition-colors duration-200">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h3 className="text-headline-sm text-foreground font-bold">
            Area-wise Severity
          </h3>
          <p className="text-body-sm text-muted-foreground mt-0.5">
            Severity distribution across affected areas
          </p>
        </div>

        {/* Legend & Total Badge */}
        <div className="flex items-center gap-3 font-mono text-[11px] text-muted-foreground flex-wrap">
          <span className="px-2 py-0.5 rounded bg-muted border border-border font-bold text-foreground">
            {totalEvents} Events
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
            Low
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-amber-500" />
            Moderate
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-orange-500" />
            High
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-red-500" />
            Severe
          </span>
        </div>
      </div>

      {/* Empty State */}
      {!hasData ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center my-6">
          <span className="material-symbols-outlined text-[36px] text-muted-foreground mb-2">
            bar_chart
          </span>
          <h4 className="text-body-md font-bold text-foreground">No severity data available</h4>
          <p className="text-body-sm text-muted-foreground mt-1 max-w-sm font-mono text-[12px]">
            No regional weather anomalies reported for this forecast.
          </p>
        </div>
      ) : (
        /* Recharts Stacked Vertical Bar Chart */
        <div className="relative flex-1 w-full min-h-[310px] mt-4 flex items-center justify-center">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 20, bottom: 35, left: 0 }}
            >
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />

              <XAxis
                dataKey="area"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontWeight: 500 }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
                interval={0}
                angle={-15}
                textAnchor="end"
              />

              <YAxis
                allowDecimals={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 11, fontFamily: 'monospace' }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
                label={{
                  value: 'Anomaly Count',
                  angle: -90,
                  position: 'insideLeft',
                  fill: 'var(--muted-foreground)',
                  fontSize: 11,
                  fontFamily: 'monospace',
                }}
              />

              <Tooltip content={<CustomTooltip />} />

              <Bar
                dataKey="low"
                name="Low"
                stackId="severity"
                fill="#22C55E"
                isAnimationActive={true}
                animationDuration={700}
                animationEasing="ease-out"
              />
              <Bar
                dataKey="moderate"
                name="Moderate"
                stackId="severity"
                fill="#EAB308"
                isAnimationActive={true}
                animationDuration={700}
                animationEasing="ease-out"
              />
              <Bar
                dataKey="high"
                name="High"
                stackId="severity"
                fill="#F97316"
                isAnimationActive={true}
                animationDuration={700}
                animationEasing="ease-out"
              />
              <Bar
                dataKey="severe"
                name="Severe"
                stackId="severity"
                fill="#EF4444"
                radius={[4, 4, 0, 0]}
                isAnimationActive={true}
                animationDuration={700}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
