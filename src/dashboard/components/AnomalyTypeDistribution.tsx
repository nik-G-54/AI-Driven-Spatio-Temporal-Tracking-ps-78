import { useMemo } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts';
import type { ActiveAnomaly } from '../dashboard.api';

interface AnomalyTypeDistributionProps {
  anomalies: ActiveAnomaly[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { type: string; count: number } }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover text-popover-foreground text-[11px] font-mono px-3 py-1.5 rounded-md shadow-md border border-border">
        <div className="font-bold">{data.type}</div>
        <div className="text-primary font-semibold">{data.count} events</div>
      </div>
    );
  }
  return null;
}

export default function AnomalyTypeDistribution({ anomalies }: AnomalyTypeDistributionProps) {
  const { chartData, maxCount, totalCount } = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of anomalies) {
      const rawType = item.type || 'Other';
      const formattedType = rawType
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      counts[formattedType] = (counts[formattedType] || 0) + 1;
    }

    const data = Object.entries(counts).map(([type, count]) => ({
      type,
      count,
    }));

    const max = Math.max(...data.map((d) => d.count), 5);
    const total = anomalies.length;

    return { chartData: data, maxCount: max, totalCount: total };
  }, [anomalies]);

  return (
    <div className="bg-card text-card-foreground border border-border rounded-lg p-5 shadow-xs flex flex-col justify-between h-full min-h-[400px]">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div>
          <h3 className="text-headline-sm text-foreground font-bold">
            Anomaly Type Distribution
          </h3>
          <p className="text-body-sm text-muted-foreground mt-0.5">
            Tracked events by anomaly category
          </p>
        </div>
        <div className="text-right font-mono text-[11px]">
          <span className="px-2.5 py-0.5 rounded bg-muted text-foreground border border-border font-bold">
            {totalCount} Tracked Events
          </span>
        </div>
      </div>

      {/* Chart Body */}
      {chartData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8 text-center text-muted-foreground text-body-sm">
          No anomaly data available
        </div>
      ) : (
        <div className="relative flex-1 w-full min-h-[300px] mt-2 flex items-center justify-center">
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <PolarGrid stroke="var(--border)" strokeDasharray="3 3" />
              <PolarAngleAxis
                dataKey="type"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 11, fontWeight: 500 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, maxCount]}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                axisLine={false}
              />
              <Radar
                name="Event Count"
                dataKey="count"
                stroke="var(--primary)"
                fill="var(--primary)"
                fillOpacity={0.35}
                strokeWidth={2}
                isAnimationActive={false}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
