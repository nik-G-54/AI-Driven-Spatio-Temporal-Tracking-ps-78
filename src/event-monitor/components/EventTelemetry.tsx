import type { EventTelemetry as EventTelemetryData } from '../event-monitor.api';

interface EventTelemetryProps {
  telemetry: EventTelemetryData;
}

export default function EventTelemetry({ telemetry }: EventTelemetryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="bg-white p-3.5 rounded-lg shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#565E74] text-[22px]">air</span>
          <div>
            <div className="text-label-sm text-[#475569] uppercase">Max Wind Core Radius</div>
            <div className="text-headline-sm text-[#0F172A] font-semibold">
              {telemetry.windCoreRadius.value} {telemetry.windCoreRadius.unit} ({telemetry.windCoreRadius.label})
            </div>
          </div>
        </div>
        <span className="font-mono text-code-sm text-[#475569]">{telemetry.windCoreRadius.classification}</span>
      </div>

      <div className="bg-white p-3.5 rounded-lg shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#565E74] text-[22px]">water_drop</span>
          <div>
            <div className="text-label-sm text-[#475569] uppercase">Precipitable Water Index</div>
            <div className="text-headline-sm text-[#0F172A] font-semibold">
              {telemetry.precipitableWater.value} {telemetry.precipitableWater.unit}
            </div>
          </div>
        </div>
        <span className="font-mono text-code-sm text-[#BA1A1A] font-semibold">{telemetry.precipitableWater.percentile}</span>
      </div>

      <div className="bg-white p-3.5 rounded-lg shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#565E74] text-[22px]">speed</span>
          <div>
            <div className="text-label-sm text-[#475569] uppercase">Translation Speed</div>
            <div className="text-headline-sm text-[#0F172A] font-semibold">
              {telemetry.translationSpeed.value} {telemetry.translationSpeed.unit} {telemetry.translationSpeed.direction}
            </div>
          </div>
        </div>
        <span className="font-mono text-code-sm text-[#475569]">Steering {telemetry.translationSpeed.steeringLevel}</span>
      </div>
    </div>
  );
}
