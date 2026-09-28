import type { DashboardKpis as DashboardKpisData } from '../dashboard.api';
import KpiCard from './KpiCard';

interface DashboardKpisProps {
  kpis: DashboardKpisData;
}

export default function DashboardKpis({ kpis }: DashboardKpisProps) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      <KpiCard
        label="Active Anomalies"
        icon="radar"
        iconBg="bg-[#EFF6FF]"
        iconColor="text-[#2563EB]"
        decorativeBg="bg-[#F1F5F9]"
        value={String(kpis.activeAnomalies.value).padStart(2, '0')}
        badge={kpis.activeAnomalies.breakdown}
        badgeBg="bg-[#F1F5F9]"
        badgeText="text-[#334155]"
        badgeBorder="border-[#E2E8F0]"
        description={kpis.activeAnomalies.description}
      />
      <KpiCard
        label="Severe Events"
        icon="warning"
        iconBg="bg-red-50"
        iconColor="text-[#DC2626]"
        decorativeBg="bg-red-50/50"
        value={String(kpis.severeEvents.value).padStart(2, '0')}
        valueColor="text-[#DC2626]"
        badge={kpis.severeEvents.context}
        badgeBg="bg-red-100/70"
        badgeText="text-[#B91C1C]"
        badgeBorder="border-red-200"
        description={kpis.severeEvents.description}
      />
      <KpiCard
        label="High-Risk Cells"
        icon="grid_4x4"
        iconBg="bg-[#EEF2FF]"
        iconColor="text-[#4F46E5]"
        decorativeBg="bg-indigo-50/40"
        value={kpis.highRiskCells.value}
        badge={kpis.highRiskCells.delta}
        badgeBg="bg-[#ECFDF5]"
        badgeText="text-[#047857]"
        badgeBorder="border-[#A7F3D0]"
        description={kpis.highRiskCells.description}
      />
      <KpiCard
        label="Forecast Horizon"
        icon="date_range"
        iconBg="bg-[#F8FAFC]"
        iconColor="text-[#475569] border border-[#E2E8F0]"
        decorativeBg="bg-slate-100"
        value={`${kpis.forecastHorizon.value} ${kpis.forecastHorizon.unit}`}
        badge={kpis.forecastHorizon.leadLabel}
        badgeBg="bg-[#F1F5F9]"
        badgeText="text-[#334155]"
        badgeBorder="border-[#E2E8F0]"
        description={kpis.forecastHorizon.description}
      />
    </section>
  );
}
