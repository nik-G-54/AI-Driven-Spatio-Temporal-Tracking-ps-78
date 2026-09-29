import type { Extent } from './fieldGrid';
import type { ColorScale } from './colorScales';

const DEG = Math.PI / 180;

const mercatorY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * DEG) / 2));
const latFromMercatorY = (y: number) => (2 * Math.atan(Math.exp(y)) - Math.PI / 2) / DEG;

// Renders a field to a canvas that MapLibre can drape over the map as an image
// source. Each pixel is sampled in Web-Mercator space (rows are NOT evenly
// spaced in latitude), so the image lines up with the basemap at any extent and
// the native grid cells appear at their true geographic size.
export function rasterizeField(
  extent: Extent,
  width: number,
  valueAt: (lat: number, lon: number) => number | null,
  scale: ColorScale,
): HTMLCanvasElement {
  const yNorth = mercatorY(extent.north);
  const ySouth = mercatorY(extent.south);
  const lonSpan = extent.east - extent.west;
  const height = Math.max(1, Math.round((width * (yNorth - ySouth)) / (lonSpan * DEG)));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return canvas;

  const image = context.createImageData(width, height);
  for (let row = 0; row < height; row += 1) {
    const lat = latFromMercatorY(yNorth - ((row + 0.5) / height) * (yNorth - ySouth));
    for (let col = 0; col < width; col += 1) {
      const lon = extent.west + ((col + 0.5) / width) * lonSpan;
      const value = valueAt(lat, lon);
      if (value === null) continue;
      const [r, g, b, a] = scale.colorAt(value);
      const offset = (row * width + col) * 4;
      image.data[offset] = r;
      image.data[offset + 1] = g;
      image.data[offset + 2] = b;
      image.data[offset + 3] = a;
    }
  }
  context.putImageData(image, 0, 0);
  return canvas;
}
