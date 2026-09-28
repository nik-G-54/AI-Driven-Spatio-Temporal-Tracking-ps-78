interface MapLegendProps {
  uncertaintyConfidence: number;
  hazardThresholdMmDay: number;
  downscalingResolutionKm: number;
}

export default function MapLegend({ uncertaintyConfidence, hazardThresholdMmDay, downscalingResolutionKm }: MapLegendProps) {
  return (
    <div className="absolute bottom-3 left-3 bg-[#0B1220]/90 backdrop-blur-md rounded-lg p-2.5 shadow-md max-w-md">
      <div className="text-label-sm text-[10px] text-[#94A3B8] uppercase font-bold tracking-wider mb-1.5">
        Cartographic Layers
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[10px] text-[#E2E8F0]">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-[#F43F5E] inline-block" />
          <span>Forecast Track (NEPS)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-2 bg-[#F59E0B]/30 border border-dashed border-[#F59E0B] inline-block" />
          <span>Cone {uncertaintyConfidence}% Spread</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] inline-block" />
          <span>Anomaly Core (&gt;{hazardThresholdMmDay}mm)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-[#3B82F6]/20 border border-[#60A5FA] inline-block" />
          <span>{downscalingResolutionKm}km Downscale Tile</span>
        </div>
      </div>
    </div>
  );
}
