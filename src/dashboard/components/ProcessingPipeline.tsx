import type { ProcessingPipeline as ProcessingPipelineData } from '../dashboard.api';
import PipelineStageRow from './PipelineStageRow';

interface ProcessingPipelineProps {
  pipeline: ProcessingPipelineData;
}

export default function ProcessingPipeline({ pipeline }: ProcessingPipelineProps) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
          <div>
            <h2 className="text-headline-sm text-[#0F172A]">Processing Pipeline Architecture</h2>
            <p className="text-body-sm text-[12px] text-[#475569] mt-0.5">
              Live status of the ML downscaling and risk extraction workflow
            </p>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-[#172554] text-[#93C5FD] border border-[#1E40AF]">
            {pipeline.badge}
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-2.5">
          {pipeline.stages.map((stage) => (
            <PipelineStageRow key={stage.stage} stage={stage} />
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] font-mono text-[#475569]">
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px] text-[#16A34A]">speed</span>
          Execution Latency: <strong className="text-[#0F172A]">{pipeline.execution.latency.value}{pipeline.execution.latency.unit}</strong> / {pipeline.execution.tile} tile
        </span>
        <span className="text-[#76777D]">Inference Node: {pipeline.execution.inferenceNode}</span>
      </div>
    </div>
  );
}
