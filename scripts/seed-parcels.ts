/**
 * Seed script for parcels table.
 * This script is documented here for reference.
 * Actual seeding is performed via Supabase SQL migrations.
 *
 * To run manually:
 * npx ts-node --esm scripts/seed-parcels.ts
 */

/** Shape of a seed parcel record */
interface SeedParcel {
  apn: string;
  address: string;
  city: string;
  county: string;
  jurisdiction: string;
  acreage: number;
  zoning: string;
  land_use: string;
  owner_name: string;
}

/** Documented parcel seed data for the Inland Empire industrial corridor */
export const SEED_PARCELS: SeedParcel[] = [
  {
    apn: '0209-241-01-0000',
    address: '4200 E Jurupa St',
    city: 'Ontario',
    county: 'San Bernardino',
    jurisdiction: 'City of Ontario',
    acreage: 45.2,
    zoning: 'M-2',
    land_use: 'Industrial',
    owner_name: 'Majestic Realty Co',
  },
  {
    apn: '0209-241-02-0000',
    address: '4300 E Jurupa St',
    city: 'Ontario',
    county: 'San Bernardino',
    jurisdiction: 'City of Ontario',
    acreage: 32.8,
    zoning: 'M-2',
    land_use: 'Industrial',
    owner_name: 'Majestic Realty Co',
  },
  {
    apn: '0113-161-23-0000',
    address: '15900 Valley Blvd',
    city: 'Fontana',
    county: 'San Bernardino',
    jurisdiction: 'City of Fontana',
    acreage: 67.5,
    zoning: 'IP',
    land_use: 'Industrial Park',
    owner_name: 'Prologis Inc',
  },
  {
    apn: '0261-091-05-0000',
    address: '2200 S Archibald Ave',
    city: 'Ontario',
    county: 'San Bernardino',
    jurisdiction: 'City of Ontario',
    acreage: 22.1,
    zoning: 'IL',
    land_use: 'Light Industrial',
    owner_name: 'Duke Realty Corp',
  },
  {
    apn: '0275-411-08-0000',
    address: '8100 Etiwanda Ave',
    city: 'Rancho Cucamonga',
    county: 'San Bernardino',
    jurisdiction: 'City of Rancho Cucamonga',
    acreage: 53.9,
    zoning: 'HI',
    land_use: 'Heavy Industrial',
    owner_name: 'Goodman Group',
  },
  {
    apn: '0239-181-11-0000',
    address: '13500 San Bernardino Ave',
    city: 'Fontana',
    county: 'San Bernardino',
    jurisdiction: 'City of Fontana',
    acreage: 89.3,
    zoning: 'M-2',
    land_use: 'Industrial',
    owner_name: 'Link Logistics',
  },
  {
    apn: '0297-051-03-0000',
    address: '3000 E Airport Dr',
    city: 'Ontario',
    county: 'San Bernardino',
    jurisdiction: 'City of Ontario',
    acreage: 41.6,
    zoning: 'AG',
    land_use: 'Airport Industrial',
    owner_name: 'CBRE Investment Mgmt',
  },
  {
    apn: '0163-431-07-0000',
    address: '18200 Slover Ave',
    city: 'Bloomington',
    county: 'San Bernardino',
    jurisdiction: 'San Bernardino County',
    acreage: 75.0,
    zoning: 'IC',
    land_use: 'Industrial Commercial',
    owner_name: 'Hillwood Development',
  },
  {
    apn: '0283-121-15-0000',
    address: '6200 Kimball Ave',
    city: 'Chino',
    county: 'San Bernardino',
    jurisdiction: 'City of Chino',
    acreage: 28.4,
    zoning: 'M-1',
    land_use: 'Manufacturing',
    owner_name: 'Rexford Industrial',
  },
  {
    apn: '0154-231-09-0000',
    address: '10700 Cedar Ave',
    city: 'Bloomington',
    county: 'San Bernardino',
    jurisdiction: 'San Bernardino County',
    acreage: 112.7,
    zoning: 'M-2',
    land_use: 'Industrial',
    owner_name: 'Majestic Realty Co',
  },
];

console.log('Parcel seed data is applied via Supabase migration.');
console.log(`Reference: ${SEED_PARCELS.length} parcels documented.`);
