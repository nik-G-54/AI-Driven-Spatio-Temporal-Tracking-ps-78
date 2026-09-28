import type { PipelineStage } from '../dashboard.api';
import { getPipelineStatusStyle } from '../dashboard.utils';

interface PipelineStageRowProps {
  stage: PipelineStage;
}

export default function PipelineStageRow({ stage }: PipelineStageRowProps) {
  const statusStyle = getPipelineStatusStyle(stage.status);

  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]/70">
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded bg-[#E2E8F0] text-[#0F172A] flex items-center justify-center font-mono text-[11px] font-bold">
          {stage.stage}
        </div>
        <div className="flex flex-col">
          <span className="text-headline-sm text-[12px] text-[#0F172A]">{stage.title}</span>
          <span className="font-mono text-[10px] text-[#475569]">{stage.description}</span>
        </div>
      </div>
      <div className={`flex items-center gap-1.5 font-mono text-[11px] font-semibold ${statusStyle.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
        {stage.statusLabel}
      </div>
    </div>
  );
}
