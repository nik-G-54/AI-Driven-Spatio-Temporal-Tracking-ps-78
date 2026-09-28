import type { BaselineComparisonData } from '../model-analysis.api';
import { getVariantStyle } from '../model-analysis.utils';

interface BaselineComparisonProps {
  comparison: BaselineComparisonData;
}

export default function BaselineComparison({ comparison }: BaselineComparisonProps) {
  return (
    <div className="min-w-0 bg-white rounded-xl shadow-sm p-6 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-headline-sm text-[#0F172A] font-bold">Quantitative Baseline Comparison</h2>
          <p className="text-body-sm text-[#475569]">
            Statistical side-by-side verification against operational 12 km dynamical NWP benchmarks
          </p>
        </div>
        <span className="font-mono text-code-sm text-[#475569]">
          Sample Size: N = {comparison.sampleSize.count} {comparison.sampleSize.label}
        </span>
      </div>

      <div className="w-full min-w-0 overflow-x-auto rounded-lg">
        <table className="w-full text-left text-body-md border-collapse">
          <thead>
            <tr className="bg-[#F8FAFC] text-[#475569] text-label-sm uppercase tracking-wider">
              <th className="py-3 px-4 font-semibold">Evaluation Metric</th>
              <th className="py-3 px-4 font-semibold">Baseline 12 km NWP</th>
              <th className="py-3 px-4 font-semibold text-[#0F172A]">Proposed AI Pipeline</th>
              <th className="py-3 px-4 font-semibold">Verification Improvement</th>
              <th className="py-3 px-4 text-center font-semibold">Operational Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] text-[13px]">
            {comparison.rows.map((row) => {
              const improvementStyle = getVariantStyle(row.improvement.variant);
              const statusStyle = getVariantStyle(row.status.variant);
              return (
                <tr key={row.metric} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-[#0F172A]">{row.metric}</td>
                  <td className="py-3.5 px-4 font-mono text-code-sm text-[#475569]">
                    {row.baseline.value}{' '}
                    {row.baseline.note && (
                      <span
                        className={row.baseline.noteVariant === 'danger' ? 'text-[#EF4444] font-normal' : 'font-normal'}
                      >
                        {row.baseline.note}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-code-sm text-[#0F172A] font-bold">
                    {row.proposed.value}{' '}
                    {row.proposed.note && (
                      <span
                        className={row.proposed.noteVariant === 'success' ? 'text-[#16A34A] font-normal' : 'font-normal'}
                      >
                        {row.proposed.note}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[13px] font-bold ${improvementStyle.text}`}>{row.improvement.value}</span>
                    <span className="text-[#475569] text-[12px]"> {row.improvement.label}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-semibold ${statusStyle.bg} ${statusStyle.text}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusStyle.dot }} />
                      {row.status.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
