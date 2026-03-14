import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import type { Parcel } from '@/types/parcel';
import type { ProjectSite } from '@/types/project';

/** Export parcels to CSV */
export function exportParcelsCSV(
  parcels: Parcel[],
  filename = 'parcels-export.csv'
): void {
  const data = parcels.map((p) => ({
    APN: p.apn ?? '',
    Address: p.situs_address ?? '',
    County: p.county ?? '',
    State: p.state_abbr ?? '',
    Acreage: p.acreage ?? '',
    Zoning: p.zoning ?? '',
    'Zoning Description': p.zoning_description ?? '',
    'Land Use': p.land_use_code ?? '',
    'Owner Name': p.owner_name ?? '',
    'Mailing Address': p.owner_mailing_address ?? '',
    'Assessed Value': p.assessed_value ?? '',
    'Legal Description': p.legal_description ?? '',
    'Data Source': p.data_source ?? '',
    'Data Date': p.data_date ?? '',
  }));

  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename);
}

/** Export project sites to CSV */
export function exportSitesCSV(
  sites: ProjectSite[],
  filename = 'sites-export.csv'
): void {
  const data = sites.map((s) => ({
    Address: s.parcel?.situs_address ?? '',
    County: s.parcel?.county ?? '',
    Acreage: s.parcel?.acreage ?? '',
    Zoning: s.parcel?.zoning ?? '',
    Status: s.status,
    Priority: s.priority,
    Notes: s.notes ?? '',
    Tags: s.tags?.join(', ') ?? '',
  }));

  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename);
}

/** Export features to GeoJSON */
export function exportGeoJSON(
  features: GeoJSON.Feature[],
  filename = 'export.geojson'
): void {
  const fc: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features,
  };
  const blob = new Blob([JSON.stringify(fc, null, 2)], {
    type: 'application/json',
  });
  saveAs(blob, filename);
}

/** Export map screenshot as PNG using html2canvas */
export async function exportMapScreenshot(
  mapContainerEl: HTMLElement,
  filename = 'map-screenshot.png'
): Promise<void> {
  const html2canvas = (await import('html2canvas')).default;
  const canvas = await html2canvas(mapContainerEl, {
    useCORS: true,
    allowTaint: true,
  });
  canvas.toBlob((blob) => {
    if (blob) saveAs(blob, filename);
  });
}
