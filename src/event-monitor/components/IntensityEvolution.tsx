import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceDot,
} from 'recharts';
import type { ApiTrajectoryResponse } from '../event-monitor.api';

interface IntensityEvolutionProps {
  trajectory: ApiTrajectoryResponse;
  selectedLeadHour?: number;
}

export default function IntensityEvolution({ trajectory, selectedLeadHour = 0 }: IntensityEvolutionProps) {
  const historicalData = (trajectory.historicalWaypoints || []).map((p, idx) => {
    const leadHour = -((trajectory.historicalWaypoints.length - idx) * 12);
    return {
      label: `T${leadHour}h`,
      leadHour,
      observedWind: p.windKmph,
      forecastWind: null as number | null,
      confidenceUpper: null as number | null,
      confidenceLower: null as number | null,
      phase: 'Observed',
      timestamp: p.timestamp,
    };
  });

  const lastHist = trajectory.historicalWaypoints?.[trajectory.historicalWaypoints.length - 1];
  const currentWind = lastHist ? lastHist.windKmph : 135;

  const currentPoint = {
    label: 'T+00h',
    leadHour: 0,
    observedWind: currentWind,
    forecastWind: currentWind,
    confidenceUpper: currentWind + 5,
    confidenceLower: Math.max(0, currentWind - 5),
    phase: 'Current',
    timestamp: lastHist ? lastHist.timestamp : 'Current',
  };

  const forecastData = (trajectory.forecastWaypoints || []).map((p, idx) => {
    const leadHour = (idx + 1) * 12;
    const coneRadius = p.coneRadiusKm || (idx + 1) * 20;
    const spread = Math.round(coneRadius * 0.4);
    return {
      label: `T+${leadHour}h`,
      leadHour,
      observedWind: null as number | null,
      forecastWind: p.windKmph,
      confidenceUpper: p.windKmph + spread,
      confidenceLower: Math.max(0, p.windKmph - spread),
      phase: 'Forecast',
      timestamp: p.timestamp,
    };
  });

  const chartData = [...historicalData, currentPoint, ...forecastData];
  const activeLabel = selectedLeadHour === 0 ? 'T+00h' : `T+${selectedLeadHour}h`;
  const activePoint = chartData.find((d) => d.label === activeLabel);

  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5 space-y-4 font-mono">
      <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0]">
        <div>
          {/* Section Header Title (13px 700 Bold 0.04em UPPERCASE #1e1b4b) */}
          <h3 className="font-mono text-[13px] font-[700] tracking-[0.04em] uppercase text-[#1e1b4b]">
            INTENSITY EVOLUTION
          </h3>
        </div>
        <div className="flex items-center gap-4 font-mono text-[11px] font-[500]">
          <span className="flex items-center gap-1.5 text-[#312e81]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#4f46e5]" /> Observed
          </span>
          <span className="flex items-center gap-1.5 text-[#991b1b]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626]" /> Forecast
          </span>
          <span className="flex items-center gap-1.5 text-[#64748b]">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#ef4444]/20 border border-[#ef4444]" /> Uncertainty Band
          </span>
        </div>
      </div>

      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="confidenceBand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} fontFamily="Geist Mono, monospace" />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              unit=" km/h"
              domain={[0, 'auto']}
              tickLine={false}
              fontFamily="Geist Mono, monospace"
            />

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="bg-[#1e1b4b] text-white p-3 rounded-lg shadow-lg font-mono text-[12px] border border-[#312e81]">
                    <div className="font-[700] text-[#e0e7ff]">{data.label} ({data.phase})</div>
                    <div className="text-[11px] text-[#a5b4fc] mb-1">{data.timestamp}</div>
                    {data.observedWind !== null && (
                      <div>Observed Wind: <span className="font-[800] text-white">{data.observedWind} km/h</span></div>
                    )}
                    {data.forecastWind !== null && (
                      <div>Forecast Wind: <span className="font-[800] text-[#f87171]">{data.forecastWind} km/h</span></div>
                    )}
                    {data.confidenceUpper !== null && (
                      <div className="text-[11px] text-[#CBD5E1]">Spread: {data.confidenceLower} - {data.confidenceUpper} km/h</div>
                    )}
                  </div>
                );
              }}
            />

            <Area
              type="monotone"
              dataKey="confidenceUpper"
              stroke="none"
              fill="url(#confidenceBand)"
              name="Uncertainty Upper"
            />
            <Area
              type="monotone"
              dataKey="confidenceLower"
              stroke="none"
              fill="#FFFFFF"
              name="Uncertainty Lower"
            />

            <Line
              type="monotone"
              dataKey="observedWind"
              stroke="#4f46e5"
              strokeWidth={3}
              dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#FFFFFF' }}
              activeDot={{ r: 6 }}
              connectNulls={true}
            />

            <Line
              type="monotone"
              dataKey="forecastWind"
              stroke="#dc2626"
              strokeWidth={3}
              strokeDasharray="4 4"
              dot={{ r: 4, fill: '#dc2626', strokeWidth: 2, stroke: '#FFFFFF' }}
              activeDot={{ r: 6 }}
              connectNulls={true}
            />

            {activePoint && (
              <ReferenceDot
                x={activeLabel}
                y={activePoint.forecastWind ?? activePoint.observedWind ?? 135}
                r={7}
                fill="#166534"
                stroke="#FFFFFF"
                strokeWidth={2.5}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
