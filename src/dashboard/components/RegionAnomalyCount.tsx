import { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
} from 'recharts';
import type { ActiveAnomaly } from '../dashboard.api';

interface RegionAnomalyCountProps {
  anomalies: ActiveAnomaly[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { region: string; count: number } }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover text-popover-foreground text-[11px] font-mono px-3 py-1.5 rounded-md shadow-md border border-border">
        <div className="font-bold">{data.region}</div>
        <div className="text-primary font-semibold">{data.count} events</div>
      </div>
    );
  }
  return null;
}

export default function RegionAnomalyCount({ anomalies }: RegionAnomalyCountProps) {
  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of anomalies) {
      const reg = item.region || 'Unspecified Domain';
      counts[reg] = (counts[reg] || 0) + 1;
    }

    return Object.entries(counts)
      .map(([region, count]) => ({
        region,
        count,
      }))
      .sort((a, b) => b.count - a.count); // Sort descending
  }, [anomalies]);

  // Adjust chart container height dynamically based on number of regions
  const chartHeight = Math.max(chartData.length * 42, 300);

  return (
    <div className="bg-card text-card-foreground border border-border rounded-lg p-5 shadow-xs flex flex-col justify-between h-full min-h-[400px]">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div>
          <h3 className="text-headline-sm text-foreground font-bold">
            Region-wise Anomaly Count
          </h3>
          <p className="text-body-sm text-muted-foreground mt-0.5">
            Tracked events across affected regions
          </p>
        </div>
        <span className="font-mono text-[11px] px-2.5 py-0.5 rounded bg-muted text-muted-foreground border border-border font-medium">
          {chartData.length} Regions Affected
        </span>
      </div>

      {/* Chart Body */}
      {chartData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8 text-center text-muted-foreground text-body-sm">
          No anomaly data available
        </div>
      ) : (
        <div className="relative flex-1 w-full min-h-[300px] mt-2 flex items-center justify-center overflow-y-auto">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 10, right: 35, bottom: 10, left: 10 }}
            >
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                dataKey="count"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="region"
                width={150}
                tick={{ fill: 'var(--foreground)', fontSize: 11, fontWeight: 500 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="count"
                fill="var(--primary)"
                radius={[0, 4, 4, 0]}
                isAnimationActive={false}
                barSize={18}
              >
                <LabelList
                  dataKey="count"
                  position="right"
                  fill="var(--foreground)"
                  fontSize={11}
                  fontWeight={600}
                  className="font-mono"
                  offset={8}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
