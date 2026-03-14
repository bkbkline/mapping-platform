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
    Address: p.address ?? '',
    City: p.city ?? '',
    County: p.county ?? '',
    Jurisdiction: p.jurisdiction ?? '',
    Acreage: p.acreage ?? '',
    Zoning: p.zoning ?? '',
    'Land Use': p.land_use ?? '',
    'Owner Name': p.owner_name ?? '',
    'Mailing Address': p.mailing_address ?? '',
    'Assessed Land Value': p.assessed_land_value ?? '',
    'Assessed Improvement Value': p.assessed_improvement_value ?? '',
    'Last Sale Price': p.last_sale_price ?? '',
    'Last Sale Date': p.last_sale_date ?? '',
    'Flood Zone': p.flood_zone ?? '',
    'Opportunity Zone': p.opportunity_zone ? 'Yes' : 'No',
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
    Address: s.parcel?.address ?? '',
    City: s.parcel?.city ?? '',
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
