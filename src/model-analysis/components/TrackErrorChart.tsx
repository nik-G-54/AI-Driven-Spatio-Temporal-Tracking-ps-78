import type { TrackErrorChartData } from '../model-analysis.api';
import { projectChartPoint } from '../model-analysis.utils';

interface TrackErrorChartProps {
  chart: TrackErrorChartData;
}

const PLOT_AREA = { x0: 40, x1: 360, y0: 20, y1: 140 };
const VIEW_WIDTH = 380;
const VIEW_HEIGHT = 160;

const SERIES_STROKE: Record<string, { color: string; width: number; markerColor: string }> = {
  neutral: { color: '#94A3B8', width: 2, markerColor: '#94A3B8' },
  primary: { color: '#0F172A', width: 2.5, markerColor: '#0F172A' },
};

export default function TrackErrorChart({ chart }: TrackErrorChartProps) {
  const highlightPoints = chart.series.map((series) => {
    const point = series.points.find((p) => p.leadHour === chart.highlightLeadHour);
    return point ? { series, point } : null;
  });

  return (
    <div className="xl:col-span-5 bg-white rounded-xl shadow-sm p-5 flex flex-col justify-between gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-headline-sm text-[#0F172A] font-bold">Track Error Progression Curve</h3>
          <p className="text-body-sm text-[#475569]">
            Forecast lead time (T+{chart.xAxis.min}h to T+{chart.xAxis.max}h)
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px]">
          {chart.series.map((series) => {
            const stroke = SERIES_STROKE[series.variant] ?? SERIES_STROKE.neutral;
            return (
              <span
                key={series.id}
                className="flex items-center gap-1"
                style={{ color: stroke.color, fontWeight: series.variant === 'primary' ? 600 : 400 }}
              >
                <span className="w-2.5 h-1 inline-block" style={{ backgroundColor: stroke.color }} />
                {series.label}
              </span>
            );
          })}
        </div>
      </div>

      <div className="relative w-full h-[180px] flex items-end">
        <svg className="w-full h-full" fill="none" viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}>
          {chart.yAxis.gridLines.map((gridValue) => {
            const { y } = projectChartPoint(chart.xAxis.min, gridValue, chart.xAxis, chart.yAxis, PLOT_AREA);
            return (
              <line
                key={gridValue}
                x1={PLOT_AREA.x0}
                x2={PLOT_AREA.x1}
                y1={y}
                y2={y}
                stroke="#CBD5E1"
                strokeWidth={gridValue === chart.yAxis.min ? 1 : 0.5}
                strokeDasharray={gridValue === chart.yAxis.min ? undefined : '3 3'}
              />
            );
          })}

          {chart.yAxis.gridLines.map((gridValue) => {
            const { y } = projectChartPoint(chart.xAxis.min, gridValue, chart.xAxis, chart.yAxis, PLOT_AREA);
            return (
              <text
                key={gridValue}
                className="fill-slate-400 font-mono"
                fontSize="9"
                textAnchor="end"
                x={PLOT_AREA.x0 - 8}
                y={y + 4}
              >
                {gridValue}
                {chart.yAxis.unit}
              </text>
            );
          })}

          {chart.series.map((series) => {
            const stroke = SERIES_STROKE[series.variant] ?? SERIES_STROKE.neutral;
            const pathD = series.points
              .map((p, index) => {
                const { x, y } = projectChartPoint(p.leadHour, p.errorKm, chart.xAxis, chart.yAxis, PLOT_AREA);
                return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
              })
              .join(' ');
            return (
              <path
                key={series.id}
                d={pathD}
                fill="none"
                stroke={stroke.color}
                strokeWidth={stroke.width}
                strokeLinecap="round"
              />
            );
          })}

          {highlightPoints.map((entry) => {
            if (!entry) return null;
            const stroke = SERIES_STROKE[entry.series.variant] ?? SERIES_STROKE.neutral;
            const { x, y } = projectChartPoint(
              entry.point.leadHour,
              entry.point.errorKm,
              chart.xAxis,
              chart.yAxis,
              PLOT_AREA,
            );
            const isPrimary = entry.series.variant === 'primary';
            return (
              <g key={entry.series.id}>
                <circle cx={x} cy={y} r={isPrimary ? 4 : 3.5} fill={stroke.markerColor} />
                <text
                  className={isPrimary ? 'fill-slate-900 font-bold font-mono' : 'fill-slate-600 font-mono'}
                  fontSize="10"
                  textAnchor="middle"
                  x={x}
                  y={isPrimary ? y + 18 : y - 10}
                >
                  {entry.point.errorKm}
                  {chart.yAxis.unit}
                </text>
              </g>
            );
          })}

          {chart.series[0]?.points.map((p) => {
            const { x } = projectChartPoint(p.leadHour, chart.yAxis.min, chart.xAxis, chart.yAxis, PLOT_AREA);
            return (
              <text
                key={p.leadHour}
                className={p.leadHour === chart.highlightLeadHour ? 'fill-slate-400 font-mono font-bold' : 'fill-slate-400 font-mono'}
                fontSize="9"
                textAnchor="middle"
                x={x}
                y={PLOT_AREA.y1 + 15}
              >
                T+{p.leadHour}h
              </text>
            );
          })}
        </svg>
      </div>

      <div className="p-3 bg-[#F8FAFC] rounded-lg flex items-center justify-between text-[11px] font-mono">
        <span className="text-[#475569]">Moisture Mass Loss Residual:</span>
        <span className="text-[#0F172A] font-semibold">
          {chart.moistureMassLossResidual.value}
          {chart.moistureMassLossResidual.unit} ({chart.moistureMassLossResidual.thresholdOperator}{' '}
          {chart.moistureMassLossResidual.threshold}
          {chart.moistureMassLossResidual.unit} requirement)
        </span>
        <span className="inline-flex items-center gap-1 text-[#16A34A] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
          {chart.moistureMassLossResidual.statusLabel}
        </span>
      </div>
    </div>
  );
}
