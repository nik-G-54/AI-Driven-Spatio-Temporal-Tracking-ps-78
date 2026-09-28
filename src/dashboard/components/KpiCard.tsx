import type { ReactNode } from 'react';

interface KpiCardProps {
  label: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  decorativeBg: string;
  value: ReactNode;
  valueColor?: string;
  badge: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  description: string;
}

export default function KpiCard({
  label,
  icon,
  iconBg,
  iconColor,
  decorativeBg,
  value,
  valueColor = 'text-[#0F172A]',
  badge,
  badgeBg,
  badgeText,
  badgeBorder,
  description,
}: KpiCardProps) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-[#CBD5E1] transition-colors relative overflow-hidden group">
      <div
        className={`absolute -right-4 -bottom-4 w-16 h-16 ${decorativeBg} rounded-full pointer-events-none group-hover:scale-125 transition-transform`}
      />
      <div className="flex items-center justify-between">
        <span className="text-label-sm text-[#475569] uppercase tracking-wider">{label}</span>
        <div className={`w-8 h-8 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center`}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
      </div>
      <div className="my-1.5 flex items-baseline gap-2">
        <span className={`text-display-md ${valueColor} tabular-nums tracking-tight`}>{value}</span>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] text-label-sm ${badgeBg} ${badgeText} border ${badgeBorder}`}
        >
          {badge}
        </span>
      </div>
      <div className="text-body-sm text-[11px] text-[#475569] truncate">{description}</div>
    </div>
  );
}
