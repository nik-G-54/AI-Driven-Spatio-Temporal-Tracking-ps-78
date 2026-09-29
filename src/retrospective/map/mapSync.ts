import type { Map as MapLibreMap } from 'maplibre-gl';

// Keeps several maps on the same viewport: panning or zooming any map moves the
// others to the same centre and zoom. Type-only import of MapLibre, so this
// module adds nothing to the main bundle.
export class MapSyncGroup {
  private maps = new Set<MapLibreMap>();
  private busy = false;

  // Registers a map and returns an unregister function.
  add(map: MapLibreMap): () => void {
    const [first] = this.maps;
    if (first) map.jumpTo({ center: first.getCenter(), zoom: first.getZoom() });

    const onMove = () => {
      if (this.busy) return;
      this.busy = true;
      const camera = { center: map.getCenter(), zoom: map.getZoom() };
      for (const other of this.maps) {
        if (other !== map) other.jumpTo(camera);
      }
      this.busy = false;
    };
    map.on('move', onMove);
    this.maps.add(map);

    return () => {
      map.off('move', onMove);
      this.maps.delete(map);
    };
  }
}
