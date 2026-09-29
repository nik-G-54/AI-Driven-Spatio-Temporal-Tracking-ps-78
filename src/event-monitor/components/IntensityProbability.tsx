import type { ApiIntensityDistributionResponse } from '../event-monitor.api';

interface IntensityProbabilityProps {
  distribution: ApiIntensityDistributionResponse;
  ensembleCount?: number;
}

export default function IntensityProbability({ distribution, ensembleCount = 20 }: IntensityProbabilityProps) {
  const bins = distribution.probabilityBins || [];
  const peakWind = distribution.peakIntensityForecastKmph || 150;

  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5 space-y-3.5 font-mono">
      <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0]">
        <div>
          {/* Section Header Title (13px 700 Bold 0.04em UPPERCASE #1e1b4b) */}
          <h3 className="font-mono text-[13px] font-[700] tracking-[0.04em] uppercase text-[#1e1b4b]">
            LANDFALL INTENSITY PROBABILITY
          </h3>
        </div>
        <span className="font-mono text-[11px] font-[700] text-[#4f46e5] bg-[#e0e7ff] px-2.5 py-1 rounded border border-indigo-200">
          N={ensembleCount} Members
        </span>
      </div>

      <div className="space-y-3 pt-1">
        {bins.map((bin) => {
          const percent = Math.round(bin.probability * 100);
          const isModal = percent >= 50;

          return (
            <div key={bin.category} className="space-y-1">
              <div className="flex justify-between font-mono text-[12px]">
                <span className={`font-[500] ${isModal ? 'text-[#991b1b] font-[700]' : 'text-[#0f172a]'}`}>
                  {bin.category} {isModal ? '★ (Modal Peak)' : ''}
                </span>
                <span className="font-[700] text-[#1e1b4b]">{percent}%</span>
              </div>
              <div className="w-full h-3 bg-[#f1f5f9] rounded-full overflow-hidden border border-[#e2e8f0]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isModal ? 'bg-[#991b1b]' : percent > 10 ? 'bg-[#4f46e5]' : 'bg-[#64748b]'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2 text-center font-mono text-[11px] text-[#64748b] border-t border-[#e2e8f0]">
        PEAK FORECAST INTENSITY: <span className="font-[800] text-[#1e1b4b]">{peakWind} km/h</span>
      </div>
    </div>
  );
}
