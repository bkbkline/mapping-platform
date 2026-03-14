import Papa from 'papaparse';

/** Result of a CSV import operation */
export interface CSVImportResult {
  features: GeoJSON.Feature[];
  errors: string[];
  rowCount: number;
}

/** Parse a CSV file with lat/lon columns into GeoJSON features */
export function parseCSVWithLatLon(file: File): Promise<CSVImportResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const features: GeoJSON.Feature[] = [];
        const errors: string[] = [];

        for (const row of results.data as Record<string, string>[]) {
          // Look for lat/lon columns (flexible naming)
          const lat = parseFloat(
            row.latitude ?? row.lat ?? row.Latitude ?? row.Lat ?? row.LAT ?? ''
          );
          const lon = parseFloat(
            row.longitude ??
              row.lon ??
              row.lng ??
              row.Longitude ??
              row.Lon ??
              row.Lng ??
              row.LNG ??
              ''
          );

          if (isNaN(lat) || isNaN(lon)) {
            errors.push(
              `Row missing valid coordinates: ${JSON.stringify(row).slice(0, 100)}`
            );
            continue;
          }

          features.push({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [lon, lat] },
            properties: row,
          });
        }

        resolve({ features, errors, rowCount: results.data.length });
      },
      error: (error) => {
        resolve({ features: [], errors: [error.message], rowCount: 0 });
      },
    });
  });
}

/** Parse a CSV file with addresses for geocoding */
export function parseCSVForGeocoding(
  file: File
): Promise<{ rows: Record<string, string>[]; errors: string[] }> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve({
          rows: results.data as Record<string, string>[],
          errors: [],
        });
      },
      error: (error) => {
        resolve({ rows: [], errors: [error.message] });
      },
    });
  });
}
