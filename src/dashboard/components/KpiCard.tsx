import type { ReactNode } from 'react';

interface KpiCardProps {
  label: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  decorativeBg: string;
  value: ReactNode;
  valueColor?: string;
  badge?: string;
  badgeBg?: string;
  badgeText?: string;
  badgeBorder?: string;
  description: string;
}

export default function KpiCard({
  label,
  icon,
  iconBg,
  iconColor,
  decorativeBg,
  value,
  valueColor = 'text-foreground',
  badge,
  badgeBg,
  badgeText,
  badgeBorder,
  description,
}: KpiCardProps) {
  return (
    <div className="bg-card text-card-foreground border border-border rounded-lg p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-colors relative overflow-hidden group">
      <div
        className={`absolute -right-4 -bottom-4 w-16 h-16 ${decorativeBg} rounded-full pointer-events-none group-hover:scale-125 transition-transform opacity-30`}
      />
      <div className="flex items-center justify-between">
        <span className="text-label-sm text-muted-foreground uppercase tracking-wider font-mono">{label}</span>
        <div className={`w-8 h-8 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center`}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
      </div>
      <div className="my-1.5 flex items-baseline gap-2">
        <span className={`text-display-md ${valueColor} tabular-nums tracking-tight font-bold`}>{value}</span>
        {badge && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] text-label-sm font-mono font-semibold ${badgeBg} ${badgeText} border ${badgeBorder}`}
          >
            {badge}
          </span>
        )}
      </div>
      <div className="text-body-sm text-[11px] text-muted-foreground truncate">{description}</div>
    </div>
  );
}
