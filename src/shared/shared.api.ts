// Data adapter for shared, application-wide chrome (Sidebar, TopHeader).
//
// Kept separate from any page's own `*.api.ts` — shared components must not
// depend on a specific page module, and this is the one resource genuinely
// used app-wide. Mock JSON now, a real backend later.

import systemStatusData from '../mockData/shared/systemStatus.json';

export interface SystemStatus {
  branding: {
    title: string;
    subtitle: string;
    mode: string;
  };
  navBadges: {
    eventMonitorSevereCount: number;
    eventDetailsThroughput: string;
    dataSourcesTag: string;
  };
  pipeline: {
    name: string;
    status: string;
    cycle: string;
    latencyMs: number;
  };
  header: {
    title: string;
    subtitle: string;
    cycleLabel: string;
    model: string;
    runStatus: string;
    systemReady: boolean;
    onlineNodes: string;
    webhookStatus: string;
    horizon: string;
  };
}

export async function getSystemStatus(): Promise<SystemStatus> {
  return systemStatusData;
}
