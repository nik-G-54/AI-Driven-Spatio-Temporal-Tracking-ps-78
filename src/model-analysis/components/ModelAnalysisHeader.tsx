import type { AvailableModels, ModelAnalysisOverview } from '../model-analysis.api';

interface ModelAnalysisHeaderProps {
  overview: ModelAnalysisOverview;
  models: AvailableModels;
  selectedModelId: string;
  onSelectModel: (id: string) => void;
  onDownloadReport: () => void;
}

export default function ModelAnalysisHeader({
  overview,
  models,
  selectedModelId,
  onSelectModel,
  onDownloadReport,
}: ModelAnalysisHeaderProps) {
  return (
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-code-sm text-[#475569] tracking-wider uppercase">
            {overview.validationLabel}
          </span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#C6C6CD]" />
          <span className="font-mono text-code-sm text-[#2563EB] font-semibold">{overview.stageLabel}</span>
        </div>
        <h1 className="text-display-md text-[#0F172A] tracking-tight">{overview.title}</h1>
        <p className="text-body-md text-[#475569] max-w-3xl">{overview.description}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative inline-flex items-center">
          <select
            value={selectedModelId}
            onChange={(event) => onSelectModel(event.target.value)}
            className="appearance-none h-9 pl-3.5 pr-8 bg-white text-[#0F172A] font-mono text-code-sm rounded-lg shadow-sm focus:outline-none cursor-pointer"
          >
            {models.options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined text-[16px] text-[#475569] pointer-events-none absolute right-2.5">
            expand_more
          </span>
        </div>

        <div className="flex items-center gap-1.5 h-9 px-3 bg-[#EFF4FF] rounded-lg shadow-sm">
          <span className="material-symbols-outlined text-[15px] text-[#475569]">dataset</span>
          <span className="font-mono text-code-sm text-[#0F172A]">{overview.benchmarkDatasetLabel}</span>
        </div>

        <button
          type="button"
          onClick={onDownloadReport}
          className="h-9 px-3.5 bg-white hover:bg-[#EFF4FF] text-[#0F172A] text-label-md rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">file_download</span>
          <span>Download Verification Report</span>
        </button>
      </div>
    </div>
  );
}
