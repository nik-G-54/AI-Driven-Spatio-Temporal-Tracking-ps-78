import type { ModelConfigurationData } from '../model-analysis.api';
import { classNames } from '../model-analysis.utils';

interface ModelConfigurationProps {
  configuration: ModelConfigurationData;
}

export default function ModelConfiguration({ configuration }: ModelConfigurationProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-black">tune</span>
          <h2 className="text-headline-sm text-[#0F172A] font-bold">Operational Model Configuration</h2>
        </div>
        <span className="font-mono text-code-sm text-[#475569]">Runtime ID: {configuration.runtimeId}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {configuration.specs.map((spec) => (
          <div key={spec.label} className="p-3.5 bg-[#F8FAFC] rounded-lg flex flex-col gap-1">
            <div className="text-label-sm text-[#475569] uppercase tracking-wider">{spec.label}</div>
            <div className="text-headline-sm text-[13px] text-[#0F172A] font-semibold mt-1">{spec.value}</div>
            <div
              className={classNames(
                'font-mono text-[11px]',
                spec.detailVariant === 'success' ? 'text-[#16A34A] font-medium' : 'text-[#475569]',
              )}
            >
              {spec.detail}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
