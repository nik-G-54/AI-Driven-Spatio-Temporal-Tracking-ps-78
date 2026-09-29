export default function RetrospectiveHeader() {
  return (
    <div className="flex flex-col gap-3 bg-white p-5 rounded-xl shadow-sm">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-black text-white">
          <span className="material-symbols-outlined text-[15px]">fact_check</span>
        </span>
        <h1 className="text-display-md text-[#0F172A] tracking-tight">Retrospective AI Validation</h1>
        <span className="text-label-sm px-2 py-0.5 rounded-full bg-amber-100 text-[#A16207] uppercase font-semibold">
          Prototype Simulation
        </span>
      </div>
      <p className="text-body-md text-[#475569]">
        Compare a forecast (NWP), an AI-refined output and a reference dataset for a historical case, to assess
        extreme-weather detection and localization.
      </p>
      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-body-sm text-[#92400E]">
        <span className="material-symbols-outlined text-[16px] mt-px">info</span>
        <span>
          All data on this page is simulated to demonstrate the interface. No real NWP data, ML model or observation
          has been used, and no result here is a measure of model performance.
        </span>
      </div>
    </div>
  );
}
