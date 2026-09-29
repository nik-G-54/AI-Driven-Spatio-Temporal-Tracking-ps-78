import type { ApiDiagnosticsResponse, ApiTelemetryResponse } from '../event-monitor.api';

interface AtmosphericDiagnosticsProps {
  diagnostics: ApiDiagnosticsResponse;
  telemetry: ApiTelemetryResponse;
}

export default function AtmosphericDiagnostics({ diagnostics, telemetry }: AtmosphericDiagnosticsProps) {
  const vorticity = diagnostics.vorticityConvectiveCoupling || 'HIGH';
  const sst = telemetry.seaSurfaceTemperatureCelsius ? `${telemetry.seaSurfaceTemperatureCelsius}°C` : '29.8°C';
  const windShearVal = telemetry.verticalWindShearKnots || 11.2;
  const windShearLabel = windShearVal < 15 ? 'LOW (FAVORABLE)' : windShearVal < 25 ? 'MODERATE' : 'HIGH';

  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5 space-y-3 font-mono">
      <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0]">
        <div>
          {/* Section Header Title (13px 700 Bold 0.04em UPPERCASE #1e1b4b) */}
          <h3 className="font-mono text-[13px] font-[700] tracking-[0.04em] uppercase text-[#1e1b4b]">
            ATMOSPHERIC DIAGNOSTICS
          </h3>
        </div>
        <span className="material-symbols-outlined text-[#4f46e5] text-[20px]">equalizer</span>
      </div>

      <div className="space-y-2 font-mono">
        {/* VORTICITY */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]">
          <span className="text-[11px] font-[700] text-[#64748b] tracking-[0.04em] uppercase">Vorticity Coupling</span>
          <span className="text-[11px] font-[700] text-[#991b1b] bg-red-50 px-2 py-0.5 rounded border border-red-200 uppercase">
            {vorticity}
          </span>
        </div>

        {/* SST */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]">
          <span className="text-[11px] font-[700] text-[#64748b] tracking-[0.04em] uppercase">Sea Surface Temp (SST)</span>
          <span className="text-[12px] font-[700] text-[#1e1b4b] bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
            {sst}
          </span>
        </div>

        {/* VERTICAL WIND SHEAR */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]">
          <span className="text-[11px] font-[700] text-[#64748b] tracking-[0.04em] uppercase">Vertical Wind Shear</span>
          <span className="text-[11px] font-[700] text-[#166534] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase">
            {windShearVal} kts — {windShearLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
