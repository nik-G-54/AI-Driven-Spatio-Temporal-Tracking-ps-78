import { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import type { ActiveAnomaly } from '../dashboard.api';

interface ZIndexForecastEvolutionProps {
  anomalies: ActiveAnomaly[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      leadTime: string;
      leadLabel: string;
      zIndex: number;
      name: string;
      type: string;
      severity: string;
    };
  }>;
}

function parseLeadHours(leadTimeStr?: string): number {
  if (!leadTimeStr) return 999;
  const matchH = leadTimeStr.match(/T\+(\d+)h/i);
  if (matchH) return parseInt(matchH[1], 10);
  const matchD = leadTimeStr.match(/D(\d+)/i);
  if (matchD) return parseInt(matchD[1], 10) * 24;
  return 999;
}

function getLeadDayLabel(hours: number): string {
  if (hours === 999) return '';
  const day = Math.round(hours / 24);
  return `D${day}`;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    const isPositive = data.zIndex >= 0;

    return (
      <div className="bg-popover text-popover-foreground text-[12px] font-mono px-3.5 py-2.5 rounded-lg shadow-md border border-border flex flex-col gap-1.5 min-w-[180px]">
        <div className="flex items-center justify-between border-b border-border pb-1 font-bold text-foreground">
          <span>Forecast Horizon</span>
          <span className="text-primary">{data.leadTime} ({data.leadLabel})</span>
        </div>
        <div className="flex items-center justify-between font-mono">
          <span className="text-muted-foreground">Z-Index:</span>
          <span className={`font-bold ${isPositive ? 'text-emerald-500' : 'text-amber-500'}`}>
            {isPositive ? `+${data.zIndex.toFixed(1)}` : data.zIndex.toFixed(1)} σ
          </span>
        </div>
        {data.name && (
          <div className="text-[11px] text-muted-foreground truncate max-w-[220px]">
            {data.name}
          </div>
        )}
        {data.severity && (
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Type: <strong className="text-foreground capitalize">{data.type}</strong></span>
            <span className="text-primary">{data.severity}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
}

export default function ZIndexForecastEvolution({ anomalies }: ZIndexForecastEvolutionProps) {
  const { chartData, hasValidData, maxZIndex, minZIndex } = useMemo(() => {
    if (!anomalies || anomalies.length === 0) {
      return { chartData: [], hasValidData: false, maxZIndex: 3, minZIndex: -1 };
    }

    // Filter items that have zIndex or equivalent metric
    const itemsWithZ = anomalies.filter(
      (a) => typeof a.zIndex === 'number' && !isNaN(a.zIndex),
    );

    if (itemsWithZ.length === 0) {
      return { chartData: [], hasValidData: false, maxZIndex: 3, minZIndex: -1 };
    }

    // Sort chronologically by lead time
    const sorted = [...itemsWithZ].sort((a, b) => parseLeadHours(a.leadTime) - parseLeadHours(b.leadTime));

    const data = sorted.map((a) => {
      const hours = parseLeadHours(a.leadTime);
      const dayLabel = getLeadDayLabel(hours);
      return {
        leadTime: a.leadTime,
        leadLabel: dayLabel,
        displayLabel: dayLabel ? `${dayLabel} (${a.leadTime})` : a.leadTime,
        zIndex: a.zIndex!,
        name: a.name,
        type: a.type,
        severity: a.severity,
      };
    });

    const values = data.map((d) => d.zIndex);
    const maxVal = Math.max(...values, 3);
    const minVal = Math.min(...values, -1);

    return {
      chartData: data,
      hasValidData: data.length > 0,
      maxZIndex: Math.ceil(maxVal + 0.5),
      minZIndex: Math.floor(minVal - 0.5),
    };
  }, [anomalies]);

  return (
    <div className="bg-card text-card-foreground border border-border rounded-lg p-5 shadow-xs flex flex-col justify-between w-full min-h-[420px] transition-colors duration-200">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div>
          <h3 className="text-headline-sm text-foreground font-bold">
            Z-Index Forecast Evolution
          </h3>
          <p className="text-body-sm text-muted-foreground mt-0.5">
            Standardized anomaly intensity across forecast lead time
          </p>
        </div>
        <div className="text-right font-mono text-[11px]">
          <span className="px-2.5 py-1 rounded bg-accent text-accent-foreground border border-border font-bold">
            {chartData.length} Forecast Lead Windows
          </span>
        </div>
      </div>

      {/* Empty State */}
      {!hasValidData ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center my-6">
          <span className="material-symbols-outlined text-[36px] text-muted-foreground mb-2">
            show_chart
          </span>
          <h4 className="text-body-md font-bold text-foreground">Z-Index data unavailable</h4>
          <p className="text-body-sm text-muted-foreground mt-1 max-w-sm font-mono text-[12px]">
            No standardized anomaly values are available for this forecast.
          </p>
        </div>
      ) : (
        /* Recharts Line Chart */
        <div className="relative flex-1 w-full min-h-[310px] mt-4 flex items-center justify-center">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, bottom: 20, left: 10 }}
            >
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              
              <XAxis
                dataKey="displayLabel"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
              />
              
              <YAxis
                domain={[minZIndex, maxZIndex]}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 11, fontFamily: 'monospace' }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
                label={{
                  value: 'Z-Index (σ)',
                  angle: -90,
                  position: 'insideLeft',
                  fill: 'var(--muted-foreground)',
                  fontSize: 11,
                  fontFamily: 'monospace',
                }}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              {/* Zero Reference Line */}
              <ReferenceLine
                y={0}
                stroke="var(--border)"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: 'Z = 0',
                  fill: 'var(--muted-foreground)',
                  fontSize: 10,
                  position: 'right',
                  fontFamily: 'monospace',
                }}
              />

              <Line
                type="monotone"
                dataKey="zIndex"
                name="Z-Index"
                stroke="var(--primary)"
                strokeWidth={2.5}
                dot={{
                  r: 4,
                  fill: 'var(--card)',
                  stroke: 'var(--primary)',
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                  fill: 'var(--primary)',
                  stroke: 'var(--card)',
                  strokeWidth: 2,
                }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
