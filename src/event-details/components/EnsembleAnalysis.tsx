import type { EventMetrics } from '../event-details.api';

interface EnsembleAnalysisProps {
  ensemble: EventMetrics['ensemble'];
}

const BAND_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  high: { bg: 'bg-[#EF4444]', text: 'text-white', dot: '#EF4444' },
  moderate: { bg: 'bg-[#F97316]', text: 'text-white', dot: '#F97316' },
  low: { bg: 'bg-[#EAB308]', text: 'text-[#0B1C30]', dot: '#EAB308' },
};

export default function EnsembleAnalysis({ ensemble }: EnsembleAnalysisProps) {
  return (
    <div className="flex flex-col bg-white rounded-xl shadow-sm p-5 gap-4">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-headline-sm text-[#0F172A]">Ensemble Signal &amp; Member Agreement</h2>
          <p className="text-body-sm text-[#475569]">
            {ensemble.memberCount} Ensemble members evaluated for T+48h localized threshold exceedance (&gt;150 mm/day)
          </p>
        </div>
        <span className="font-mono text-code-sm font-bold text-[#0F172A] bg-[#E5EEFF] px-2 py-0.5 rounded">
          {ensemble.memberCount} MEMBERS
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="w-full h-8 bg-[#E5EEFF] rounded-lg flex overflow-hidden shadow-inner">
          {ensemble.distribution.map((band) => {
            const style = BAND_COLORS[band.id] ?? BAND_COLORS.low;
            return (
              <div
                key={band.id}
                className={`h-full ${style.bg} ${style.text} flex items-center justify-center font-mono text-code-sm font-bold`}
                style={{ width: `${band.percent}%` }}
              >
                {band.count} {band.label} ({band.percent}%)
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center justify-between font-mono text-[11px] text-[#475569]">
          {ensemble.distribution.map((band) => {
            const style = BAND_COLORS[band.id] ?? BAND_COLORS.low;
            return (
              <span key={band.id} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: style.dot }} />
                {band.description}
              </span>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        <div className="p-3 bg-[#EFF4FF] rounded-lg flex flex-col">
          <span className="text-[10px] uppercase text-[#475569]">Spatial Variance</span>
          <span className="text-headline-lg font-bold text-[#0F172A]">
            {ensemble.spatialVariance.value} {ensemble.spatialVariance.unit}
          </span>
          <span className="font-mono text-[10px] text-[#475569]">{ensemble.spatialVariance.note}</span>
        </div>
        <div className="p-3 bg-[#EFF4FF] rounded-lg flex flex-col">
          <span className="text-[10px] uppercase text-[#475569]">Track Dispersal</span>
          <span className="text-headline-lg font-bold text-[#0F172A]">{ensemble.trackDispersal.value}</span>
          <span className="font-mono text-[10px] text-[#3F465C]">{ensemble.trackDispersal.note}</span>
        </div>
        <div className="p-3 bg-[#EFF4FF] rounded-lg flex flex-col">
          <span className="text-[10px] uppercase text-[#475569]">Ensemble Mean</span>
          <span className="text-headline-lg font-bold text-[#0F172A]">{ensemble.ensembleMean.value}</span>
          <span className="font-mono text-[10px] text-[#475569]">{ensemble.ensembleMean.unit}</span>
        </div>
        <div className="p-3 bg-[#EFF4FF] rounded-lg flex flex-col">
          <span className="text-[10px] uppercase text-[#475569]">Control Shift</span>
          <span className="text-headline-lg font-bold text-[#EF4444]">
            +{ensemble.controlShift.value} {ensemble.controlShift.unit}
          </span>
          <span className="font-mono text-[10px] text-[#475569]">{ensemble.controlShift.note}</span>
        </div>
      </div>
    </div>
  );
}
