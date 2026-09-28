import { useMemo } from 'react';
import type { ActiveAnomaly } from '../dashboard.api';
import KpiCard from './KpiCard';

interface DashboardKpisProps {
  anomalies: ActiveAnomaly[];
}

export default function DashboardKpis({ anomalies }: DashboardKpisProps) {
  const { activeCount, severeCount, nextWindowText, distinctAreasCount } = useMemo(() => {
    const active = anomalies.length;

    const severe = anomalies.filter((a) => {
      const s = (a.severity || '').toUpperCase();
      return s === 'SEVERE' || s === 'EXTREME';
    }).length;

    // Find earliest critical/severe forecast lead window
    const criticalEvents = anomalies.filter((a) => {
      const s = (a.severity || '').toUpperCase();
      return s === 'SEVERE' || s === 'EXTREME' || s === 'HIGH';
    });

    let nextWindow = 'No critical window';
    if (criticalEvents.length > 0) {
      // Pick event with earliest lead time if available
      const earliest = criticalEvents.sort((a, b) => {
        const getHours = (str?: string) => {
          if (!str) return 999;
          const match = str.match(/T\+(\d+)h/i);
          return match ? parseInt(match[1], 10) : 999;
        };
        return getHours(a.leadTime) - getHours(b.leadTime);
      })[0];

      if (earliest?.leadTime) {
        nextWindow = earliest.leadTime;
      } else if (earliest?.landfallEta) {
        nextWindow = earliest.landfallEta;
      }
    }

    // Count distinct regions affected
    const distinctRegions = new Set(
      anomalies
        .map((a) => a.region?.trim())
        .filter((r): r is string => Boolean(r && r.length > 0)),
    ).size;

    return {
      activeCount: active,
      severeCount: severe,
      nextWindowText: nextWindow,
      distinctAreasCount: distinctRegions,
    };
  }, [anomalies]);

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {/* 1. ACTIVE ANOMALIES */}
      <KpiCard
        label="ACTIVE ANOMALIES"
        icon="sensors"
        iconBg="bg-accent"
        iconColor="text-primary"
        decorativeBg="bg-accent"
        value={anomalies.length > 0 ? String(activeCount).padStart(2, '0') : '—'}
        description="Dataset anomaly events"
      />

      {/* 2. SEVERE EVENTS */}
      <KpiCard
        label="SEVERE EVENTS"
        icon="warning"
        iconBg="bg-destructive/10"
        iconColor="text-destructive"
        decorativeBg="bg-destructive/20"
        value={anomalies.length > 0 ? String(severeCount).padStart(2, '0') : '—'}
        valueColor="text-destructive"
        description="High / Severe severity tier"
      />

      {/* 3. NEXT WINDOW */}
      <KpiCard
        label="NEXT WINDOW"
        icon="schedule"
        iconBg="bg-amber-500/10"
        iconColor="text-amber-500 font-bold"
        decorativeBg="bg-amber-500/20"
        value={anomalies.length > 0 ? nextWindowText : '—'}
        valueColor="text-amber-500"
        description="Earliest critical event lead time"
      />

      {/* 4. AREAS AT RISK */}
      <KpiCard
        label="AREAS AT RISK"
        icon="public"
        iconBg="bg-emerald-500/10"
        iconColor="text-emerald-500"
        decorativeBg="bg-emerald-500/20"
        value={anomalies.length > 0 ? String(distinctAreasCount).padStart(2, '0') : '—'}
        description="Distinct geographic zones"
      />
    </section>
  );
}
