export interface SatelliteSnapshot {
  timestamp: string;
  label: string;
  timeAgo: string;
  description: string;
  cloudDensity: string;
  eyeStructure: string;
  vorticityScore: number;
}

export interface TrackPoint {
  timestamp: string;
  label: string;
  lat: number;
  lon: number;
  windKmph: number;
  pressureHpa: number;
}

export interface SimulatedCycloneData {
  id: string;
  type: string;
  name: string;
  locationName: string;
  latitude: number;
  longitude: number;
  severity: 'SEVERE' | 'EXTREME' | 'HIGH';
  confidence: number;
  statusLabel: string;
  detectedDay: string;
  movement: string;
  track: TrackPoint[];
  satelliteImages: SatelliteSnapshot[];
}

export const DEMO_CYCLONE: SimulatedCycloneData = {
  id: 'DEMO-BOB-001',
  type: 'cyclone',
  name: 'Demo Bay of Bengal Anomaly',
  locationName: 'Bay of Bengal (15.2°N, 87.4°E)',
  latitude: 15.2,
  longitude: 87.4,
  severity: 'SEVERE',
  confidence: 0.91,
  statusLabel: 'SIMULATED DEMO EVENT',
  detectedDay: 'Day 4',
  movement: 'NW @ 16 km/h',
  track: [
    { timestamp: 'T-12h', label: 'T-12h', lat: 12.8, lon: 89.2, windKmph: 85, pressureHpa: 994 },
    { timestamp: 'T-6h', label: 'T-6h', lat: 13.7, lon: 88.5, windKmph: 110, pressureHpa: 986 },
    { timestamp: 'T-3h', label: 'T-3h', lat: 14.4, lon: 87.9, windKmph: 125, pressureHpa: 982 },
    { timestamp: 'NOW', label: 'NOW', lat: 15.2, lon: 87.4, windKmph: 135, pressureHpa: 978 },
  ],
  satelliteImages: [
    {
      timestamp: 'T-6h',
      label: 'T - 6 HOURS',
      timeAgo: '6 hours ago',
      description: 'Initial convective cloud cluster forming low-pressure vortex over deep oceanic waters.',
      cloudDensity: '82%',
      eyeStructure: 'Developing Cloud-Cleared Core',
      vorticityScore: 0.74,
    },
    {
      timestamp: 'T-3h',
      label: 'T - 3 HOURS',
      timeAgo: '3 hours ago',
      description: 'Organizing spiral rainbands with rapid baroclinic intensification and outflow channels.',
      cloudDensity: '91%',
      eyeStructure: 'Pinhole Eye Formation',
      vorticityScore: 0.86,
    },
    {
      timestamp: 'NOW',
      label: 'CURRENT (NOW)',
      timeAgo: 'Live Satellite Pass',
      description: 'Severe cyclonic storm structure with symmetrical central dense overcast (CDO) and active wall convection.',
      cloudDensity: '98%',
      eyeStructure: 'Well-Defined Symmetric Eye',
      vorticityScore: 0.94,
    },
  ],
};
