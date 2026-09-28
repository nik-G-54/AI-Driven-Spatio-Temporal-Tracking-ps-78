import { Link } from 'react-router-dom';
import type { ActiveAnomaly } from '../dashboard.api';
import { classNames, getSeverityStyle } from '../dashboard.utils';

interface AnomalyCardProps {
  anomaly: ActiveAnomaly;
  isSelected: boolean;
  onSelect: () => void;
}

export default function AnomalyCard({ anomaly, isSelected, onSelect }: AnomalyCardProps) {
  const style = getSeverityStyle(anomaly.severity);
  const isSevereWash = anomaly.severity.toLowerCase() === 'severe';
  const hasExpandedDetail = Boolean(anomaly.landfallEta || anomaly.status);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onSelect();
      }}
      className={classNames(
        'p-3 rounded-lg border relative shadow-xs transition-all cursor-pointer border-l-4',
        isSevereWash ? 'border-red-200 bg-red-50/40' : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]',
        isSelected ? 'ring-2 ring-[#0F172A]/15' : '',
      )}
      style={{ borderLeftColor: style.accent }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-headline-sm text-[13px] text-[#0F172A] font-bold flex items-center gap-1.5">
            <span>
              {anomaly.name}
              {anomaly.id ? ` (${anomaly.id})` : ''}
            </span>
          </div>
          <p className="text-body-sm text-[11px] text-[#475569] mt-0.5">
            {anomaly.region}
            {anomaly.coordinates && (
              <>
                {' '}
                ({anomaly.coordinates.latitude}°N, {anomaly.coordinates.longitude}°E
                {anomaly.destination ? ` → ${anomaly.destination}` : ''})
              </>
            )}
          </p>
        </div>
        <span
          className={classNames(
            'inline-flex items-center px-2 py-0.5 rounded text-[10px] text-label-sm border tracking-wider',
            style.badgeBg,
            style.badgeText,
            style.badgeBorder,
          )}
        >
          {anomaly.severity}
        </span>
      </div>

      <div
        className={classNames(
          'grid grid-cols-2 gap-2 mt-2.5 pt-2 border-t font-mono text-[11px]',
          isSevereWash ? 'border-red-200/60' : 'border-[#F1F5F9]',
        )}
      >
        <div>
          <span className="text-[#64748B] block text-[9px] uppercase">Peak Rainfall</span>
          <span className={classNames('font-bold', isSevereWash ? 'text-[#B91C1C]' : 'text-[#0F172A]')}>
            {anomaly.peakRainfall.value} {anomaly.peakRainfall.unit}
          </span>
        </div>
        <div>
          <span className="text-[#64748B] block text-[9px] uppercase">
            {anomaly.maxWind ? 'Max Sustained Wind' : 'Lead Time'}
          </span>
          <span className="font-semibold text-[#0F172A]">
            {anomaly.maxWind ? `${anomaly.maxWind.value} ${anomaly.maxWind.unit}` : anomaly.leadTime}
          </span>
        </div>
      </div>

      {hasExpandedDetail && (
        <>
          {anomaly.landfallEta && (
            <div className="mt-2 text-[11px] font-mono text-[#475569] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px] text-[#475569]">schedule</span>
              <span>
                Lead: <strong>{anomaly.leadTime}</strong> (Landfall ETA: {anomaly.landfallEta})
              </span>
            </div>
          )}
          <div className="mt-3 pt-2 border-t border-red-200/50 flex items-center justify-between">
            {anomaly.status && (
              <span className="text-label-sm text-[10px] text-[#B91C1C] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-pulse" />
                {anomaly.status}
              </span>
            )}
            <Link
              to="/event-monitor"
              onClick={(event) => event.stopPropagation()}
              className="inline-flex items-center gap-1 text-[11px] text-label-md text-[#2563EB] hover:text-[#1D4ED8] font-semibold"
            >
              <span>Inspect Event Monitor</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
