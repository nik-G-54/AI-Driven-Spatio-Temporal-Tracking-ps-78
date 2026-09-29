import type { WeatherAnalysis } from '../analysis/analysis.types';
import type { MapRegion } from './FieldMap';
import type { DataView } from './WeatherLayerSelector';

// Labels shown on the map ribbon / titles. Every simulated view says SIMULATED.
export const RIBBON: Record<DataView, string> = {
  nwp: 'NWP INPUT — SIMULATED',
  ai: 'AI REFINED — SIMULATED',
  reference: 'REFERENCE — SIMULATED',
  difference: 'AI REFINED − NWP — SIMULATED',
  anomaly: 'EXTREME-THRESHOLD ANOMALY — SIMULATED',
  satellite: 'Satellite Context — SIMULATED',
  radar: 'Radar Context — SIMULATED',
};

export function toMapRegions(analysis: WeatherAnalysis): MapRegion[] {
  return analysis.regions.map((r) => ({ kind: r.kind, ring: r.ring }));
}
