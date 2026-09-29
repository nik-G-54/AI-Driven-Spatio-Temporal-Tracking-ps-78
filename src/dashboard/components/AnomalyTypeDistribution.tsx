import { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
  Tooltip,
} from 'recharts';
import type { ActiveAnomaly } from '../dashboard.api';

interface AnomalyTypeDistributionProps {
  anomalies: ActiveAnomaly[];
}

const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

const getPath = (x: number, y: number, width: number, height: number) => {
  return `M${x},${y + height}C${x + width / 3},${y + height} ${x + width / 2},${y + height / 3}
  ${x + width / 2}, ${y}
  C${x + width / 2},${y + height / 3} ${x + (2 * width) / 3},${y + height} ${x + width}, ${y + height}
  Z`;
};

const TriangleBar = (props: any) => {
  const { x, y, width, height, index, isActive } = props;
  const nx = Number(x || 0);
  const ny = Number(y || 0);
  const nw = Number(width || 0);
  const nh = Number(height || 0);

  if (nw <= 0 || nh <= 0) return null;

  const color = colors[(index ?? 0) % colors.length];

  return (
    <path
      strokeWidth={isActive ? 3 : 0}
      d={getPath(nx, ny, nw, nh)}
      stroke={color}
      fill={color}
      style={{
        transition: 'stroke-width 0.3s ease-out',
      }}
    />
  );
};

const CustomColorLabel = (props: any) => {
  const { x, y, width, value, index } = props;
  if (value === undefined || value === null) return null;
  const fill = colors[(index ?? 0) % colors.length];
  const cx = Number(x || 0) + Number(width || 0) / 2;
  const cy = Number(y || 0) - 8;

  return (
    <text
      x={cx}
      y={cy}
      fill={fill}
      textAnchor="middle"
      fontSize={12}
      fontWeight={700}
    >
      {value}
    </text>
  );
};

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
  const { chartData, totalCount } = useMemo(() => {
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

    return { chartData: data, totalCount: anomalies.length };
  }, [anomalies]);

  return (
    <div className="bg-card text-card-foreground border border-border rounded-lg p-5 shadow-xs flex flex-col justify-between h-full min-h-[400px]">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div>
          <h3 className="text-headline-sm text-foreground font-bold">
            Anomaly Type Distribution
          </h3>
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
        <div className="relative flex-1 w-full min-h-[300px] mt-4 flex items-center justify-center">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={chartData}
              margin={{
                top: 30,
                right: 20,
                left: 0,
                bottom: 75,
              }}
            >
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="type"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 11, fontWeight: 500 }}
                interval={0}
                angle={-90}
                textAnchor="end"
                height={85}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                width={30}
              />
              <Tooltip cursor={{ fillOpacity: 0.1, fill: 'var(--muted)' }} content={<CustomTooltip />} />
              <Bar dataKey="count" shape={TriangleBar}>
                <LabelList content={CustomColorLabel} position="top" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
