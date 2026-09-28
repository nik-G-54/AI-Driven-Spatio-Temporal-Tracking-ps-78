import type { HazardCellInspector } from '../event-details.api';
import { formatCoordinate } from '../event-details.utils';

interface GridInspectorProps {
  hazard: HazardCellInspector;
}

export default function GridInspector({ hazard }: GridInspectorProps) {
  const exceedancePercent = Math.min(100, hazard.exceedanceProbability.value);

  return (
    <div className="flex flex-col bg-white rounded-xl shadow-sm p-5 gap-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#E5EEFF]">
        <div className="flex flex-col">
          <h2 className="text-headline-sm text-[#0F172A]">Cell #{hazard.cellId} Inspector</h2>
          <span className="text-body-sm text-[#475569]">{hazard.sector}</span>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-100 text-[#93000A] text-label-sm font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-ping" />
          {hazard.riskLevel}
        </span>
      </div>

      <div className="flex flex-col divide-y divide-[#E5EEFF] text-body-sm">
        <div className="flex items-center justify-between py-2.5">
          <span className="text-[#475569]">Centroid Coordinates</span>
          <span className="font-mono text-code-sm font-semibold text-[#0F172A]">
            {formatCoordinate(hazard.centroid.latitude, hazard.centroid.longitude)}
          </span>
        </div>
        <div className="flex items-center justify-between py-2.5">
          <span className="text-[#475569]">Hazard Classification</span>
          <span className="text-[#0F172A] font-medium text-right">{hazard.hazardClassification}</span>
        </div>
        <div className="flex items-center justify-between py-2.5">
          <span className="text-[#475569]">AI Predicted Intensity</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-headline-sm text-[#EF4444] font-bold">{hazard.aiPredictedIntensity.value}</span>
            <span className="font-mono text-code-sm text-[#475569]">{hazard.aiPredictedIntensity.unit}</span>
            <span className="font-mono text-[10px] text-[#475569] line-through ml-1">
              {hazard.nwpComparisonIntensity.value} ({hazard.nwpComparisonIntensity.label})
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between py-2.5">
          <span className="text-[#475569]">Exceedance Prob (&gt;{hazard.exceedanceProbability.thresholdMmDay}mm)</span>
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 bg-[#E5EEFF] rounded-full overflow-hidden">
              <div className="h-full bg-[#EF4444]" style={{ width: `${exceedancePercent}%` }} />
            </div>
            <span className="font-mono text-code-sm font-bold text-[#0F172A]">{hazard.exceedanceProbability.value}%</span>
          </div>
        </div>
        <div className="flex items-center justify-between py-2.5">
          <span className="text-[#475569]">Ensemble Consensus</span>
          <span className="font-mono text-code-sm font-semibold text-[#0F172A]">
            {hazard.ensembleConsensus.inTier} / {hazard.ensembleConsensus.total} in {hazard.ensembleConsensus.tier} Tier
          </span>
        </div>
        <div className="flex items-center justify-between py-2.5">
          <span className="text-[#475569]">Vulnerability Exposure</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#DCE9FF] text-[#0F172A] font-semibold text-right">
            {hazard.vulnerabilityExposure}
          </span>
        </div>
      </div>

      <div className="p-3 bg-[#EFF4FF] rounded-lg flex items-center justify-between font-mono text-code-sm text-[#475569]">
        <span>
          Terrain Elevation: <strong className="text-[#0F172A]">{hazard.terrainElevation.value} {hazard.terrainElevation.unit}</strong>
        </span>
        <span>
          Saturated Soil: <strong className="text-[#EF4444]">{hazard.saturatedSoil.value}{hazard.saturatedSoil.unit}</strong>
        </span>
      </div>
    </div>
  );
}
