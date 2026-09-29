import { useMemo } from 'react';
import type { SatelliteObservation } from '../satellite/satellite.types';
import { BRIGHTNESS_TEMPERATURE_SCALE } from '../map/colorScales';
import { gridExtent, sampleNearest, toFieldGrid, unionExtent } from '../map/fieldGrid';
import type { MapSyncGroup } from '../map/mapSync';
import type { FieldData } from '../map/useFieldData';
import FieldMap from './FieldMap';
import LegendBar from './LegendBar';

// One satellite observation on the same map foundation and camera as the
// analytical maps, clipped to its own grid (never stretched), with the
// reference exceedance footprint outlined for spatial reference only.

interface SatelliteContextMapProps {
  // All observations of the context (the map extent is fixed for all of them).
  observations: SatelliteObservation[];
  // The observation to show now.
  observationId: string;
  data: FieldData;
  frameIndex: number;
  sync: MapSyncGroup;
}

export default function SatelliteContextMap({ observations, observationId, data, frameIndex, sync }: SatelliteContextMapProps) {
  const grids = useMemo(
    () =>
      new Map(
        observations.flatMap((o) => (o.raster.kind === 'grid' ? [[o.observationId, toFieldGrid(o.raster.field)] as const] : [])),
      ),
    [observations],
  );
  const extent = useMemo(() => unionExtent([...grids.values()].map(gridExtent)), [grids]);

  const grid = grids.get(observationId);
  const observation = observations.find((o) => o.observationId === observationId);
  const valueAt = useMemo(() => (grid ? (lat: number, lon: number) => sampleNearest(grid, lat, lon) : () => null), [grid]);

  if (!grid || !observation) return null;
  const reference = data.footprint('reference', frameIndex);

  return (
    <div className="flex flex-col gap-2">
      <FieldMap
        extent={extent}
        focus={data.focus}
        valueAt={valueAt}
        scale={BRIGHTNESS_TEMPERATURE_SCALE}
        unit={observation.unit}
        primaryOutline={reference?.outline ?? null}
        sync={sync}
        ariaLabel="Simulated satellite context map"
        className="h-[400px]"
      />
      <LegendBar
        title="Brightness temperature (simulated)"
        unit={observation.unit}
        scale={BRIGHTNESS_TEMPERATURE_SCALE}
        outlines={[{ label: 'Reference exceedance footprint (prototype threshold, for spatial reference only)' }]}
      />
    </div>
  );
}
