import { CAP, PANEL, SIM_CHIP } from './ui';

const PIPELINE = ['NWP input', 'AI refinement', 'Extreme detection', 'Localisation', 'Temporal evolution', 'Forecaster analysis'];

export default function RetrospectiveHeader() {
  return (
    <div className={`${PANEL} flex flex-col`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <circle cx="14" cy="14" r="12.5" stroke="#38BDF8" strokeWidth="1.2" />
          <circle cx="14" cy="14" r="8" stroke="#38BDF8" strokeOpacity=".55" strokeWidth="1.2" />
          <circle cx="14" cy="14" r="3.2" fill="#38BDF8" />
          <path d="M14 1.5V6.5M14 21.5V26.5M1.5 14H6.5M21.5 14H26.5" stroke="#38BDF8" strokeOpacity=".5" strokeWidth="1.2" />
        </svg>
        <h1 className="font-mono text-[15px] font-semibold tracking-[0.12em] text-[#E6EDF4]">EXTREME WEATHER ANALYSIS</h1>
        <span className={SIM_CHIP}>PROTOTYPE SIMULATION</span>
        <ol className="flex flex-wrap items-center gap-1.5 ml-auto" aria-label="Analysis pipeline">
          {PIPELINE.map((stage, i) => (
            <li key={stage} className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] tracking-[0.06em] uppercase px-1.5 py-0.5 border border-[#243140] text-[#B7C2CF]">
                <span className="text-[#38BDF8]">{String(i + 1).padStart(2, '0')}</span> {stage}
              </span>
              {i < PIPELINE.length - 1 && <span className="text-[#3A4756]">→</span>}
            </li>
          ))}
        </ol>
      </div>
      <div className="flex items-center gap-2 px-4 py-1.5 border-t border-[#1F2A36] bg-[#FBBF24]/[0.05] text-[11px] text-[#E9CF8C]">
        <span className={CAP + ' !text-[#FBBF24]'}>Notice</span>
        <span>
          AI REFINED output is <strong>simulated</strong>: no ML model was trained or run. Fields, radar and satellite context are prototype simulations derived from the
          mock backend values — not observations, real forecasts or measured model results.
        </span>
      </div>
    </div>
  );
}
