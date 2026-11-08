export interface GeocodeResult {
  displayName: string;
  latitude: number;
  longitude: number;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

/**
 * Looks up an address via OpenStreetMap's Nominatim search API — free, no API
 * key, but rate-limited to roughly one request per second and intended for
 * light, user-initiated lookups like this one (not bulk/automated use), per
 * https://operations.osmfoundation.org/policies/nominatim/.
 */
export async function searchAddress(query: string): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(trimmed)}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error('Address lookup failed');
  }

  const results: NominatimResult[] = await response.json();
  return results.map((result) => ({
    displayName: result.display_name,
    latitude: Number(result.lat),
    longitude: Number(result.lon),
  }));
}
