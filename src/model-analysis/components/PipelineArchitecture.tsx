import { Fragment } from 'react';
import type { PipelineArchitectureData } from '../model-analysis.api';
import { classNames, getVariantStyle } from '../model-analysis.utils';

interface PipelineArchitectureProps {
  pipeline: PipelineArchitectureData;
  selectedStageOrder: number | null;
  onSelectStage: (order: number) => void;
}

export default function PipelineArchitecture({ pipeline, selectedStageOrder, onSelectStage }: PipelineArchitectureProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-black">account_tree</span>
            <h2 className="text-headline-sm text-[#0F172A] font-bold">End-to-End ML Pipeline Architecture</h2>
          </div>
          <p className="text-body-sm text-[#475569] mt-0.5">{pipeline.description}</p>
        </div>
        <div className="flex items-center gap-2 font-mono text-code-sm text-[#475569]">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#EFF4FF] rounded text-[#0F172A] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
            {pipeline.activeStagesCount} Stages Active
          </span>
          <span>Cycle: {pipeline.cycleSyncLabel}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 pt-2">
        {pipeline.stages.map((stage) => {
          const badgeStyle = getVariantStyle(stage.badgeVariant);
          const isSelected = stage.order === selectedStageOrder;
          return (
            <button
              key={stage.order}
              type="button"
              onClick={() => onSelectStage(stage.order)}
              className={classNames(
                'relative bg-[#F8FAFC] rounded-lg p-3.5 flex flex-col justify-between h-[132px] text-left transition-shadow hover:shadow-md',
                isSelected && 'ring-2 ring-[#0F172A]',
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-code-sm text-[#475569] tracking-tight font-semibold">
                  {stage.name}
                </span>
                <span
                  className={classNames(
                    'text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wider',
                    badgeStyle.bg,
                    badgeStyle.text,
                  )}
                >
                  {stage.badge}
                </span>
              </div>
              <div className="text-[12px] leading-[17px] text-[#0F172A] font-medium line-clamp-3">
                {stage.description}
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="font-mono text-[10px] text-[#475569]">{stage.footerLeft}</span>
                <span className="material-symbols-outlined text-[14px] text-[#475569]">{stage.icon}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="hidden xl:flex items-center justify-between px-2 pt-1 font-mono text-[11px] text-[#475569]">
        {pipeline.connectivity.map((step, index) => (
          <Fragment key={step.label}>
            {index > 0 && (
              <span className="material-symbols-outlined text-[16px] text-[#C6C6CD]">trending_flat</span>
            )}
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-[#475569]">{step.icon}</span>
              <span>{step.label}</span>
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
