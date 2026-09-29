// Production API client for the Event Monitor page.
// Fetches from the backend API: https://mock-prahari.onrender.com/api
// Falls back gracefully to local mock data if the API is offline or unreachable.

import eventData from '../mockData/eventMonitor/event.json';
import eventOptionsData from '../mockData/eventMonitor/eventOptions.json';
import trajectoryData from '../mockData/eventMonitor/trajectory.json';
import downstreamRiskAlertsData from '../mockData/eventMonitor/downstreamRiskAlerts.json';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://mock-prahari.onrender.com/api').replace(/\/+$/, '');

// Types matching live Backend Endpoints

export interface ApiEventListItem {
  id: string;
  name: string;
  type: string;
  severity: 'EXTREME' | 'HIGH' | 'MODERATE' | 'LOW' | string;
  basin: string;
  status: string;
}

export interface ApiEventDetails {
  id: string;
  name: string;
  category: string;
  location: {
    lat: number;
    lon: number;
  };
  maxWindSpeedKmph: number;
  centralPressureHpa: number;
  movementDirection: string;
  forwardSpeedKmph: number;
  estimatedLandfallTime: string | null;
  estimatedLandfallLocation: string | null;
}

export interface ApiHistoricalWaypoint {
  timestamp: string;
  lat: number;
  lon: number;
  windKmph: number;
}

export interface ApiForecastWaypoint {
  timestamp: string;
  lat: number;
  lon: number;
  windKmph: number;
  coneRadiusKm: number;
}

export interface ApiTrajectoryResponse {
  eventId: string;
  historicalWaypoints: ApiHistoricalWaypoint[];
  forecastWaypoints: ApiForecastWaypoint[];
}

export interface ApiTimelineEvent {
  time: string;
  title: string;
  type: 'GENESIS' | 'INTENSIFICATION' | 'ALERT' | 'FORECAST' | string;
}

export interface ApiTimelineResponse {
  eventId: string;
  timelineEvents: ApiTimelineEvent[];
}

export interface ApiTelemetryResponse {
  eventId: string;
  currentWindSpeedMps: number;
  gustSpeedMps: number;
  surfacePressureHpa: number;
  seaSurfaceTemperatureCelsius: number;
  verticalWindShearKnots: number;
  lastTelemetrySync: string;
}

export interface ApiDiagnosticsResponse {
  eventId: string;
  gnnConfidenceScore: number;
  ensembleDispersionIndex: number;
  vorticityConvectiveCoupling: string;
  downscalingConvergenceResidual: number;
  anomalyZScore: number;
}

export interface ApiIntensityBin {
  category: string;
  probability: number;
}

export interface ApiIntensityDistributionResponse {
  eventId: string;
  probabilityBins: ApiIntensityBin[];
  peakIntensityForecastKmph: number;
}

export interface ApiRiskAlertItem {
  alert_id: string;
  urgency_level: string;
  severity_level: string;
  certainty_code: string;
  event_code: string;
  headline: string;
  area_description: string;
  instruction: string;
}

export interface EventMonitorBundle {
  eventList: ApiEventListItem[];
  eventDetails: ApiEventDetails;
  trajectory: ApiTrajectoryResponse;
  timeline: ApiTimelineResponse;
  telemetry: ApiTelemetryResponse;
  diagnostics: ApiDiagnosticsResponse;
  intensityDistribution: ApiIntensityDistributionResponse;
  riskAlerts: ApiRiskAlertItem[];
}

// Fetch helper with timeout
async function fetchWithTimeout<T>(url: string, timeoutMs = 8000): Promise<T> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
    }
    return (await res.json()) as T;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// API functions with fallback

export async function fetchEventList(): Promise<ApiEventListItem[]> {
  try {
    const data = await fetchWithTimeout<ApiEventListItem[]>(`${API_BASE_URL}/events/`);
    if (Array.isArray(data) && data.length > 0) return data;
  } catch (err) {
    console.warn('[EventMonitor API] Failed to fetch event list, using local fallback:', err);
  }
  // Fallback to local mock data
  return eventOptionsData.map((opt) => ({
    id: opt.id,
    name: opt.label,
    type: opt.id.startsWith('BOB') ? 'Cyclone' : opt.id.startsWith('AS') ? 'Depression' : 'Heavy Rain',
    severity: opt.severity.toUpperCase(),
    basin: opt.id.startsWith('BOB') ? 'Bay of Bengal' : opt.id.startsWith('AS') ? 'Arabian Sea' : 'Northeast India',
    status: 'ACTIVE_TRACKING',
  }));
}

export async function fetchEventDetails(eventId: string): Promise<ApiEventDetails> {
  try {
    return await fetchWithTimeout<ApiEventDetails>(`${API_BASE_URL}/events/${eventId}`);
  } catch (err) {
    console.warn(`[EventMonitor API] Failed to fetch details for ${eventId}, using fallback:`, err);
    const mock = (eventData as Record<string, any>)[eventId] || (eventData as Record<string, any>)['BOB-02'];
    return {
      id: mock.id || eventId,
      name: mock.name || mock.displayName || `Event ${eventId}`,
      category: mock.classification || 'Category 3',
      location: { lat: mock.currentPosition.latitude, lon: mock.currentPosition.longitude },
      maxWindSpeedKmph: mock.intensity.maxWind,
      centralPressureHpa: mock.centralPressure.value,
      movementDirection: mock.telemetry?.translationSpeed?.direction || 'NNW',
      forwardSpeedKmph: mock.telemetry?.translationSpeed?.value || 16,
      estimatedLandfallTime: mock.landfall?.eta || '2026-09-30T04:00:00Z',
      estimatedLandfallLocation: mock.landfall?.sector || 'Odisha Coast, India',
    };
  }
}

export async function fetchEventTrajectory(eventId: string): Promise<ApiTrajectoryResponse> {
  try {
    return await fetchWithTimeout<ApiTrajectoryResponse>(`${API_BASE_URL}/events/${eventId}/trajectory`);
  } catch (err) {
    console.warn(`[EventMonitor API] Failed to fetch trajectory for ${eventId}, using fallback:`, err);
    const mock = (trajectoryData as Record<string, any>)[eventId] || (trajectoryData as Record<string, any>)['BOB-02'];
    return {
      eventId,
      historicalWaypoints: mock.historical.map((p: any) => ({
        timestamp: p.timestamp,
        lat: p.latitude,
        lon: p.longitude,
        windKmph: 85 + p.leadHour * 2,
      })),
      forecastWaypoints: mock.forecast.map((p: any, idx: number) => ({
        timestamp: p.timestamp,
        lat: p.latitude,
        lon: p.longitude,
        windKmph: 145 - idx * 10,
        coneRadiusKm: 25 + idx * 25,
      })),
    };
  }
}

export async function fetchEventTimeline(eventId: string): Promise<ApiTimelineResponse> {
  try {
    return await fetchWithTimeout<ApiTimelineResponse>(`${API_BASE_URL}/events/${eventId}/timeline`);
  } catch (err) {
    console.warn(`[EventMonitor API] Failed to fetch timeline for ${eventId}, using fallback:`, err);
    return {
      eventId,
      timelineEvents: [
        { time: '2026-09-26T18:00:00Z', title: 'Formation of Low Pressure System', type: 'GENESIS' },
        { time: '2026-09-27T06:00:00Z', title: 'Upgraded to Cyclonic Storm', type: 'INTENSIFICATION' },
        { time: '2026-09-28T00:00:00Z', title: 'Rapid Intensification to Severe Storm', type: 'ALERT' },
        { time: '2026-09-30T04:00:00Z', title: 'Projected Landfall near Paradip', type: 'FORECAST' },
      ],
    };
  }
}

export async function fetchEventTelemetry(eventId: string): Promise<ApiTelemetryResponse> {
  try {
    return await fetchWithTimeout<ApiTelemetryResponse>(`${API_BASE_URL}/events/${eventId}/telemetry`);
  } catch (err) {
    console.warn(`[EventMonitor API] Failed to fetch telemetry for ${eventId}, using fallback:`, err);
    return {
      eventId,
      currentWindSpeedMps: 37.5,
      gustSpeedMps: 46.2,
      surfacePressureHpa: 978.2,
      seaSurfaceTemperatureCelsius: 29.8,
      verticalWindShearKnots: 11.2,
      lastTelemetrySync: new Date().toISOString(),
    };
  }
}

export async function fetchEventDiagnostics(eventId: string): Promise<ApiDiagnosticsResponse> {
  try {
    return await fetchWithTimeout<ApiDiagnosticsResponse>(`${API_BASE_URL}/events/${eventId}/diagnostics`);
  } catch (err) {
    console.warn(`[EventMonitor API] Failed to fetch diagnostics for ${eventId}, using fallback:`, err);
    return {
      eventId,
      gnnConfidenceScore: 0.94,
      ensembleDispersionIndex: 0.12,
      vorticityConvectiveCoupling: 'HIGH',
      downscalingConvergenceResidual: 0.0034,
      anomalyZScore: 3.82,
    };
  }
}

export async function fetchEventIntensityDistribution(eventId: string): Promise<ApiIntensityDistributionResponse> {
  try {
    return await fetchWithTimeout<ApiIntensityDistributionResponse>(`${API_BASE_URL}/events/${eventId}/intensity-distribution`);
  } catch (err) {
    console.warn(`[EventMonitor API] Failed to fetch intensity distribution for ${eventId}, using fallback:`, err);
    return {
      eventId,
      probabilityBins: [
        { category: 'Depression', probability: 0.01 },
        { category: 'Deep Depression', probability: 0.04 },
        { category: 'Cyclonic Storm', probability: 0.15 },
        { category: 'Severe Cyclonic Storm', probability: 0.65 },
        { category: 'Very Severe Cyclonic Storm', probability: 0.15 },
      ],
      peakIntensityForecastKmph: 150,
    };
  }
}

export async function fetchEventRiskAlerts(eventId: string): Promise<ApiRiskAlertItem[]> {
  try {
    return await fetchWithTimeout<ApiRiskAlertItem[]>(`${API_BASE_URL}/events/${eventId}/risk-alerts`);
  } catch (err) {
    console.warn(`[EventMonitor API] Failed to fetch risk alerts for ${eventId}, using fallback:`, err);
    const mockAlerts = (downstreamRiskAlertsData as Record<string, any>)[eventId] || (downstreamRiskAlertsData as Record<string, any>)['BOB-02'];
    return mockAlerts.map((a: any, i: number) => ({
      alert_id: `CAP-IN-OD-2026-00${i + 90}`,
      urgency_level: 'Immediate',
      severity_level: a.severity || 'Extreme',
      certainty_code: 'Observed',
      event_code: 'CYC',
      headline: `Red Alert: Severe Warning for ${a.location}`,
      area_description: a.location,
      instruction: `Initiate evacuation and preparation for ${a.hazard}`,
    }));
  }
}

// Master bundle loader that fetches all endpoints in parallel with resilient error handling
export async function getEventMonitorBundle(eventId: string): Promise<EventMonitorBundle> {
  const [
    eventListRes,
    eventDetailsRes,
    trajectoryRes,
    timelineRes,
    telemetryRes,
    diagnosticsRes,
    intensityDistRes,
    riskAlertsRes,
  ] = await Promise.allSettled([
    fetchEventList(),
    fetchEventDetails(eventId),
    fetchEventTrajectory(eventId),
    fetchEventTimeline(eventId),
    fetchEventTelemetry(eventId),
    fetchEventDiagnostics(eventId),
    fetchEventIntensityDistribution(eventId),
    fetchEventRiskAlerts(eventId),
  ]);

  const eventList = eventListRes.status === 'fulfilled' ? eventListRes.value : [];
  const eventDetails =
    eventDetailsRes.status === 'fulfilled'
      ? eventDetailsRes.value
      : await fetchEventDetails(eventId); // Fallback attempt
  const trajectory =
    trajectoryRes.status === 'fulfilled'
      ? trajectoryRes.value
      : await fetchEventTrajectory(eventId);
  const timeline =
    timelineRes.status === 'fulfilled'
      ? timelineRes.value
      : await fetchEventTimeline(eventId);
  const telemetry =
    telemetryRes.status === 'fulfilled'
      ? telemetryRes.value
      : await fetchEventTelemetry(eventId);
  const diagnostics =
    diagnosticsRes.status === 'fulfilled'
      ? diagnosticsRes.value
      : await fetchEventDiagnostics(eventId);
  const intensityDistribution =
    intensityDistRes.status === 'fulfilled'
      ? intensityDistRes.value
      : await fetchEventIntensityDistribution(eventId);
  const riskAlerts =
    riskAlertsRes.status === 'fulfilled'
      ? riskAlertsRes.value
      : await fetchEventRiskAlerts(eventId);

  return {
    eventList,
    eventDetails,
    trajectory,
    timeline,
    telemetry,
    diagnostics,
    intensityDistribution,
    riskAlerts,
  };
}
