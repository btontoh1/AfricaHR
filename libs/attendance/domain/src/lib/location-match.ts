import { GeoPoint, haversineDistanceMeters, isOutsideGeofence } from './geofence';

export interface AttendanceLocationCandidate {
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export interface LocationMatch {
  locationName: string;
  distanceMeters: number;
  outsideGeofence: boolean;
}

/**
 * Finds the tenant location nearest to a punch position. Advisory only: the
 * match is used to label which location a punch is closest to, never to
 * block a clock-in/out, even when outsideGeofence is true (see
 * AttendanceRecordService.evaluateGeofence).
 */
export function findNearestLocation(
  position: GeoPoint,
  locations: AttendanceLocationCandidate[],
): LocationMatch | null {
  if (locations.length === 0) {
    return null;
  }

  let nearest = locations[0];
  let nearestDistance = haversineDistanceMeters(position, nearest);

  for (const location of locations.slice(1)) {
    const distance = haversineDistanceMeters(position, location);
    if (distance < nearestDistance) {
      nearest = location;
      nearestDistance = distance;
    }
  }

  return {
    locationName: nearest.name,
    distanceMeters: nearestDistance,
    outsideGeofence: isOutsideGeofence(nearestDistance, nearest.radiusMeters),
  };
}
