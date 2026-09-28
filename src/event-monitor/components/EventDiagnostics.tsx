import type { EventDiagnostics as EventDiagnosticsData } from '../event-monitor.api';

interface EventDiagnosticsProps {
  diagnostics: EventDiagnosticsData;
}

export default function EventDiagnostics({ diagnostics }: EventDiagnosticsProps) {
  return (
    <div className="bg-white rounded-lg divide-y divide-[#DCE9FF] py-1">
      <div className="py-2.5 flex items-center justify-between text-body-sm">
        <span className="text-[#475569] font-medium">Affected 5 km Cells</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[#0F172A] font-bold">{diagnostics.affected5kmCells.value} Cells</span>
          <span className="text-label-sm text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-[#93000A] font-semibold">
            {diagnostics.affected5kmCells.extremeZoneCount} in Extreme Zone
          </span>
        </div>
      </div>
      <div className="py-2.5 flex items-center justify-between text-body-sm">
        <span className="text-[#475569] font-medium">Max Gust Forecast</span>
        <span className="font-mono text-[#0F172A] font-bold text-headline-sm">
          {diagnostics.maxGustForecast.value} {diagnostics.maxGustForecast.unit}
        </span>
      </div>
      <div className="py-2.5 flex items-center justify-between text-body-sm">
        <span className="text-[#475569] font-medium">NWP Model Input</span>
        <span className="font-mono text-[#0F172A] font-medium">
          {diagnostics.nwpModelInput.model} {diagnostics.nwpModelInput.cycle} ({diagnostics.nwpModelInput.resolution})
        </span>
      </div>
      <div className="py-2.5 flex items-center justify-between text-body-sm">
        <span className="text-[#475569] font-medium">Spatio-Temporal GNN</span>
        <div className="text-right">
          <div className="font-mono text-[#0F172A] font-medium">{diagnostics.spatioTemporalGnn.node}</div>
          <div className="font-mono text-[10px] text-[#565E74]">
            Inference time: {diagnostics.spatioTemporalGnn.inferenceTimeMs}ms
          </div>
        </div>
      </div>
      <div className="py-2.5 flex items-center justify-between text-body-sm">
        <span className="text-[#475569] font-medium">Ocean Thermal Energy</span>
        <span className="font-mono text-[#0F172A] font-medium">
          TCHP {diagnostics.oceanThermalEnergy.comparator} {diagnostics.oceanThermalEnergy.value} {diagnostics.oceanThermalEnergy.unit}
        </span>
      </div>
    </div>
  );
}
