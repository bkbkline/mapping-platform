/** Result of parsing a GeoJSON file */
export interface GeoJSONParseResult {
  data: GeoJSON.FeatureCollection | null;
  error: string | null;
}

/** Validate and parse a GeoJSON file */
export async function parseGeoJSON(file: File): Promise<GeoJSONParseResult> {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text) as Record<string, unknown>;

    if (parsed.type === 'FeatureCollection') {
      return { data: parsed as unknown as GeoJSON.FeatureCollection, error: null };
    }

    if (parsed.type === 'Feature') {
      return {
        data: {
          type: 'FeatureCollection',
          features: [parsed as unknown as GeoJSON.Feature],
        },
        error: null,
      };
    }

    // Try wrapping raw geometry
    if (parsed.type && parsed.coordinates) {
      return {
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: parsed as unknown as GeoJSON.Geometry,
              properties: {},
            },
          ],
        },
        error: null,
      };
    }

    return { data: null, error: 'Invalid GeoJSON format' };
  } catch (e) {
    return {
      data: null,
      error: `Failed to parse GeoJSON: ${(e as Error).message}`,
    };
  }
}
