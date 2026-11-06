import { findNearestLocation } from './location-match';

describe('findNearestLocation', () => {
  it('returns null when there are no locations', () => {
    expect(findNearestLocation({ latitude: 5.6, longitude: -0.19 }, [])).toBeNull();
  });

  it('returns the single location when only one is configured', () => {
    const result = findNearestLocation(
      { latitude: 5.6, longitude: -0.19 },
      [{ name: 'HQ', latitude: 5.6, longitude: -0.19, radiusMeters: 100 }],
    );

    expect(result).toEqual({ locationName: 'HQ', distanceMeters: 0, outsideGeofence: false });
  });

  it('picks the nearest of several locations', () => {
    const result = findNearestLocation(
      { latitude: 0, longitude: 0 },
      [
        { name: 'Far', latitude: 2, longitude: 0, radiusMeters: 100 },
        { name: 'Near', latitude: 0.001, longitude: 0, radiusMeters: 100 },
        { name: 'Mid', latitude: 1, longitude: 0, radiusMeters: 100 },
      ],
    );

    expect(result?.locationName).toBe('Near');
  });

  it('flags outsideGeofence when the nearest location is still beyond its own radius', () => {
    const result = findNearestLocation(
      { latitude: 0, longitude: 0 },
      [{ name: 'HQ', latitude: 1, longitude: 0, radiusMeters: 100 }],
    );

    expect(result).toEqual({ locationName: 'HQ', distanceMeters: 111195, outsideGeofence: true });
  });

  it('does not flag outsideGeofence when within the nearest location radius', () => {
    const result = findNearestLocation(
      { latitude: 0, longitude: 0 },
      [{ name: 'HQ', latitude: 0, longitude: 0.0001, radiusMeters: 100 }],
    );

    expect(result?.outsideGeofence).toBe(false);
  });
});
