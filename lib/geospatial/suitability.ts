import type { Parcel, SuitabilityBreakdown, ScoredParcel } from '@/types/parcel';

/** Minimum acreage threshold for industrial sites */
const MIN_INDUSTRIAL_ACREAGE = 5;

/** Industrial-compatible zoning codes */
const INDUSTRIAL_ZONES = ['M-1', 'M-2', 'M-3', 'I-1', 'I-2', 'I-3', 'MU', 'PD', 'C-3'];

/** Flood zones that disqualify a site */
const DISQUALIFYING_FLOOD_ZONES = ['A', 'AE', 'AH', 'AO', 'V', 'VE'];

/** Calculate industrial suitability score (0-100) for a parcel */
export function calculateSuitabilityScore(parcel: Parcel): SuitabilityBreakdown {
  const acreage_score = scoreAcreage(parcel.acreage);
  const zoning_score = scoreZoning(parcel.zoning);
  const floodZone = parcel.raw_attributes?.flood_zone as string | null | undefined;
  const flood_zone_score = scoreFloodZone(floodZone ?? null);
  const highway_proximity_score = 15; // placeholder — needs spatial query
  const rail_access_score = 10; // placeholder — needs spatial query
  const infrastructure_score = 10; // placeholder — needs spatial query

  return {
    acreage_score,
    zoning_score,
    highway_proximity_score,
    rail_access_score,
    flood_zone_score,
    infrastructure_score,
  };
}

/** Score a parcel with suitability data */
export function scoreParcel(parcel: Parcel): ScoredParcel {
  const breakdown = calculateSuitabilityScore(parcel);
  const total = Object.values(breakdown).reduce((sum, v) => sum + v, 0);
  return {
    ...parcel,
    suitability_score: Math.min(100, total),
    score_breakdown: breakdown,
  };
}

function scoreAcreage(acreage: number | null): number {
  if (acreage === null) return 0;
  if (acreage >= MIN_INDUSTRIAL_ACREAGE * 4) return 25;
  if (acreage >= MIN_INDUSTRIAL_ACREAGE * 2) return 20;
  if (acreage >= MIN_INDUSTRIAL_ACREAGE) return 15;
  if (acreage >= MIN_INDUSTRIAL_ACREAGE * 0.5) return 5;
  return 0;
}

function scoreZoning(zoning: string | null): number {
  if (!zoning) return 0;
  const code = zoning.toUpperCase().trim();
  if (INDUSTRIAL_ZONES.some(z => code.includes(z))) return 25;
  if (code.includes('C') || code.includes('COMM')) return 10;
  return 0;
}

function scoreFloodZone(floodZone: string | null): number {
  if (!floodZone) return 15; // no data = assume ok
  if (DISQUALIFYING_FLOOD_ZONES.includes(floodZone.toUpperCase())) return 0;
  return 15;
}
