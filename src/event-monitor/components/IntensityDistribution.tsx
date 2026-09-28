import type { IntensityDistribution as IntensityDistributionData } from '../event-monitor.api';

interface IntensityDistributionProps {
  distribution: IntensityDistributionData;
}

const MAX_BAR_HEIGHT = 28;
const MIN_BAR_HEIGHT = 4;

export default function IntensityDistribution({ distribution }: IntensityDistributionProps) {
  const maxPercentage = Math.max(...distribution.distribution.map((d) => d.percentage), 1);
  const modalItem = distribution.distribution.find((d) => d.isModal);
  const firstItem = distribution.distribution[0];
  const lastItem = distribution.distribution[distribution.distribution.length - 1];

  return (
    <div className="bg-[#EFF4FF] p-3.5 rounded-lg flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-label-sm text-[#0F172A] uppercase font-semibold">Landfall Intensity Distribution</span>
        <span className="font-mono text-[10px] text-[#565E74]">{distribution.ensembleMembers} Perturbations</span>
      </div>

      <div className="w-full h-7 flex gap-1 items-end pt-1">
        {distribution.distribution.map((item) => {
          const height = Math.max(MIN_BAR_HEIGHT, (item.percentage / maxPercentage) * MAX_BAR_HEIGHT);
          return (
            <div
              key={item.label}
              title={`${item.label} (${item.percentage}%)`}
              className="flex-1 rounded-xs"
              style={{ height: `${height}px`, backgroundColor: item.isModal ? '#BA1A1A' : '#BCC7DE' }}
            />
          );
        })}
      </div>

      <div className="flex justify-between font-mono text-[9px] text-[#475569]">
        <span>{firstItem?.label}</span>
        {modalItem && <span className="font-bold text-[#BA1A1A]">{modalItem.label} (Modal)</span>}
        <span>{lastItem?.label}</span>
      </div>
    </div>
  );
}
