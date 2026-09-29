import type { EventDetection, ValidationMetric } from '../retrospective.types';
import { classNames, formatBounds, formatConfidence, formatEventType, formatValue } from '../retrospective.utils';

interface ValidationPanelProps {
  metrics: ValidationMetric[];
  detection: EventDetection;
}

const STATUS_LABEL: Record<ValidationMetric['status'], string> = {
  pending: 'Not computed',
  simulated: 'Simulated',
  computed: 'Computed',
};

export default function ValidationPanel({ metrics, detection }: ValidationPanelProps) {
  return (
    <section className="flex flex-col gap-4 bg-white p-5 rounded-xl shadow-sm" aria-label="Validation and comparison">
      <div>
        <h2 className="text-headline-sm text-[#0F172A] font-bold">Validation / Comparison</h2>
        <div className="text-label-sm text-[#475569]">Illustrative comparison — no real experiment has been run</div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-body-sm">
          <thead>
            <tr className="text-label-sm text-[#64748B] uppercase tracking-wider border-b border-[#E2E8F0]">
              <th className="py-2 pr-3 font-semibold">Metric</th>
              <th className="py-2 pr-3 font-semibold">Forecast (NWP)</th>
              <th className="py-2 pr-3 font-semibold">AI output</th>
              <th className="py-2 pr-3 font-semibold">Reference</th>
              <th className="py-2 pr-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric) => (
              <tr key={metric.name} className="border-b border-[#F1F5F9] align-top">
                <td className="py-2 pr-3 text-[#0F172A] font-medium">
                  {metric.name}
                  <div className="text-label-sm text-[#64748B] font-normal normal-case tracking-normal">
                    {metric.note}
                  </div>
                </td>
                <td className="py-2 pr-3 font-mono text-[#0F172A]">{formatValue(metric.baseline, metric.unit)}</td>
                <td className="py-2 pr-3 font-mono text-[#0F172A]">{formatValue(metric.aiOutput, metric.unit)}</td>
                <td className="py-2 pr-3 font-mono text-[#0F172A]">{formatValue(metric.reference, metric.unit)}</td>
                <td className="py-2 pr-3">
                  <span
                    className={classNames(
                      'text-[10px] px-2 py-0.5 rounded font-semibold uppercase whitespace-nowrap',
                      metric.status === 'pending' && 'bg-[#F1F5F9] text-[#475569]',
                      metric.status === 'simulated' && 'bg-amber-100 text-[#A16207]',
                      metric.status === 'computed' && 'bg-[#DCFCE7] text-[#15803D]',
                    )}
                  >
                    {STATUS_LABEL[metric.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-2 rounded-lg bg-[#F8FAFC] p-3">
        <span className="text-label-sm text-[#64748B] uppercase tracking-wider">
          Event detection (simulated)
        </span>
        <dl className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <Item label="Event type" value={formatEventType(detection.eventType)} />
          <Item label="Severity" value={detection.severity} />
          <Item label="Confidence" value={formatConfidence(detection.confidence)} />
          <Item label="Affected region" value={formatBounds(detection.affectedRegion)} />
        </dl>
      </div>
    </section>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-label-sm text-[#64748B] uppercase tracking-wider">{label}</dt>
      <dd className="text-body-sm text-[#0F172A] font-medium capitalize break-words">{value}</dd>
    </div>
  );
}
