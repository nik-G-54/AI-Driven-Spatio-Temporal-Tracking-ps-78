import type { Extent } from './fieldGrid';

// Small gazetteer of well-known Indian cities (approximate city-centre
// coordinates) used only as geographic reference labels, so the local vector
// basemap — which has no text layers — still gives place context. These are NOT
// model output or data for any case. Only places inside the shown extent are used.
export interface Place {
  name: string;
  latitude: number;
  longitude: number;
}

export const PLACES: Place[] = [
  { name: 'Mumbai', latitude: 19.076, longitude: 72.878 },
  { name: 'Thane', latitude: 19.218, longitude: 72.978 },
  { name: 'Alibag', latitude: 18.641, longitude: 72.872 },
  { name: 'Pune', latitude: 18.52, longitude: 73.857 },
  { name: 'Lonavala', latitude: 18.75, longitude: 73.409 },
  { name: 'Mahabaleshwar', latitude: 17.923, longitude: 73.658 },
  { name: 'Ratnagiri', latitude: 16.99, longitude: 73.312 },
  { name: 'Nashik', latitude: 19.998, longitude: 73.79 },
  { name: 'Panaji', latitude: 15.499, longitude: 73.826 },
  { name: 'Surat', latitude: 21.17, longitude: 72.831 },
  { name: 'Ahmedabad', latitude: 23.023, longitude: 72.572 },
  { name: 'Vadodara', latitude: 22.307, longitude: 73.181 },
  { name: 'Nagpur', latitude: 21.146, longitude: 79.088 },
  { name: 'Hyderabad', latitude: 17.385, longitude: 78.487 },
  { name: 'Bengaluru', latitude: 12.972, longitude: 77.594 },
  { name: 'Chennai', latitude: 13.083, longitude: 80.27 },
  { name: 'Bhubaneswar', latitude: 20.296, longitude: 85.825 },
  { name: 'Kolkata', latitude: 22.573, longitude: 88.364 },
  { name: 'Bhopal', latitude: 23.26, longitude: 77.413 },
  { name: 'Jaipur', latitude: 26.912, longitude: 75.787 },
  { name: 'Delhi', latitude: 28.614, longitude: 77.209 },
  { name: 'Lucknow', latitude: 26.847, longitude: 80.947 },
];

// Places inside the extent, capped so labels stay a light reference layer.
export function placesWithin(extent: Extent, limit = 8): Place[] {
  return PLACES.filter(
    (p) => p.latitude >= extent.south && p.latitude <= extent.north && p.longitude >= extent.west && p.longitude <= extent.east,
  ).slice(0, limit);
}
