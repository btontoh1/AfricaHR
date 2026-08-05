import { haversineDistanceMeters, isOutsideGeofence } from './geofence';

describe('haversineDistanceMeters', () => {
  it('is zero for the same point', () => {
    expect(haversineDistanceMeters({ latitude: 5.6, longitude: -0.19 }, { latitude: 5.6, longitude: -0.19 })).toBe(0);
  });

  it('computes the great-circle distance between two points', () => {
    // Pure north-south separation of 1 degree of latitude is ~111.2km
    // regardless of longitude - a stable, easy-to-verify reference case.
    const distance = haversineDistanceMeters({ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 0 });

    expect(distance).toBe(111195);
  });

  it('is symmetric', () => {
    const a = { latitude: 5.6037, longitude: -0.187 };
    const b = { latitude: 5.61, longitude: -0.2 };

    expect(haversineDistanceMeters(a, b)).toBe(haversineDistanceMeters(b, a));
  });
});

describe('isOutsideGeofence', () => {
  it('is false when the distance is within the radius', () => {
    expect(isOutsideGeofence(80, 100)).toBe(false);
  });

  it('is false when the distance exactly equals the radius', () => {
    expect(isOutsideGeofence(100, 100)).toBe(false);
  });

  it('is true when the distance exceeds the radius', () => {
    expect(isOutsideGeofence(101, 100)).toBe(true);
  });
});
