import type { DatasetKey } from '../retrospective.types';
import type { SatelliteAlignment, SatelliteObservation, TemporalAlignment } from './satellite.types';

// One analytic time step: the valid time of each dataset at that step.
export interface AnalyticStep {
  leadTimeHours: number;
  times: Record<DatasetKey, string | null>;
}

const minutesBetween = (a: string, b: string) => (Date.parse(a) - Date.parse(b)) / 60000;

// Aligns observations to analytic steps. Never silently substitutes a frame: an
// observation is used for a step only if it is exactly at that time (MATCHED) or
// within the tolerance (NEARBY, to be shown as "nearest available observation"
// with its own time). Otherwise the step is MISSING and shows no frame.
export function alignObservations(steps: AnalyticStep[], observations: SatelliteObservation[], toleranceMinutes: number): SatelliteAlignment[] {
  const timed = observations.filter((o): o is SatelliteObservation & { validTime: string } => o.validTime !== null);

  return steps.map((step, stepIndex): SatelliteAlignment => {
    // The three analytic datasets are expected to share a valid time; use the reference as the anchor.
    const anchor = step.times.reference ?? step.times.ai ?? step.times.nwp;
    if (anchor === null || timed.length === 0) {
      return { stepIndex, leadTimeHours: step.leadTimeHours, analyticTimes: step.times, status: 'missing', observationId: null, nearestObservationTime: null, offsetMinutes: null };
    }

    let nearest = timed[0];
    let nearestOffset = minutesBetween(nearest.validTime, anchor);
    for (const observation of timed) {
      const offset = minutesBetween(observation.validTime, anchor);
      if (Math.abs(offset) < Math.abs(nearestOffset)) {
        nearest = observation;
        nearestOffset = offset;
      }
    }

    const status: TemporalAlignment = nearestOffset === 0 ? 'matched' : Math.abs(nearestOffset) <= toleranceMinutes ? 'nearby' : 'missing';
    return {
      stepIndex,
      leadTimeHours: step.leadTimeHours,
      analyticTimes: step.times,
      status,
      observationId: status === 'missing' ? null : nearest.observationId,
      nearestObservationTime: nearest.validTime,
      offsetMinutes: nearestOffset,
    };
  });
}

// "+15 min", "−6 h", "0 min"
export function formatOffset(minutes: number | null): string {
  if (minutes === null) return '—';
  if (minutes === 0) return '0 min';
  const sign = minutes > 0 ? '+' : '−';
  const abs = Math.abs(minutes);
  return abs % 60 === 0 && abs >= 60 ? `${sign}${abs / 60} h` : `${sign}${abs} min`;
}
