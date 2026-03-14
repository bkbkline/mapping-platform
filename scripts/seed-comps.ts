/**
 * Seed script for comps (sales comparables) table.
 * This script is documented here for reference.
 * Actual seeding is performed via Supabase SQL migrations.
 *
 * To run manually:
 * npx ts-node --esm scripts/seed-comps.ts
 */

/** Shape of a seed comp record */
interface SeedComp {
  address: string;
  sale_price: number;
  sale_date: string;
  lot_size: number;
  building_sf: number;
  price_per_acre: number;
  buyer: string;
  seller: string;
  latitude: number;
  longitude: number;
}

/** Documented comp seed data for the Inland Empire industrial corridor */
export const SEED_COMPS: SeedComp[] = [
  {
    address: '4050 E Jurupa St, Ontario, CA 91761',
    sale_price: 45_000_000,
    sale_date: '2025-06-15',
    lot_size: 35.2,
    building_sf: 650_000,
    price_per_acre: 1_278_409,
    buyer: 'Prologis Inc',
    seller: 'Private Owner LLC',
    latitude: 34.0422,
    longitude: -117.5827,
  },
  {
    address: '15700 Valley Blvd, Fontana, CA 92335',
    sale_price: 72_500_000,
    sale_date: '2025-03-22',
    lot_size: 55.0,
    building_sf: 1_100_000,
    price_per_acre: 1_318_182,
    buyer: 'Rexford Industrial',
    seller: 'Duke Realty Corp',
    latitude: 34.0854,
    longitude: -117.4856,
  },
  {
    address: '2100 S Archibald Ave, Ontario, CA 91761',
    sale_price: 18_200_000,
    sale_date: '2025-09-10',
    lot_size: 15.3,
    building_sf: 280_000,
    price_per_acre: 1_189_542,
    buyer: 'Link Logistics',
    seller: 'KBS Realty Advisors',
    latitude: 34.0312,
    longitude: -117.6145,
  },
  {
    address: '8300 Etiwanda Ave, Rancho Cucamonga, CA 91739',
    sale_price: 95_000_000,
    sale_date: '2024-11-05',
    lot_size: 62.8,
    building_sf: 1_250_000,
    price_per_acre: 1_512_739,
    buyer: 'Goodman Group',
    seller: 'Trammell Crow Co',
    latitude: 34.1017,
    longitude: -117.5382,
  },
  {
    address: '13200 San Bernardino Ave, Fontana, CA 92335',
    sale_price: 38_750_000,
    sale_date: '2025-01-18',
    lot_size: 42.0,
    building_sf: 720_000,
    price_per_acre: 922_619,
    buyer: 'Majestic Realty Co',
    seller: 'Panattoni Development',
    latitude: 34.0601,
    longitude: -117.4523,
  },
  {
    address: '3100 E Airport Dr, Ontario, CA 91761',
    sale_price: 56_000_000,
    sale_date: '2024-08-30',
    lot_size: 48.5,
    building_sf: 875_000,
    price_per_acre: 1_154_639,
    buyer: 'CBRE Investment Mgmt',
    seller: 'Watson Land Co',
    latitude: 34.0561,
    longitude: -117.5694,
  },
  {
    address: '18400 Slover Ave, Bloomington, CA 92316',
    sale_price: 29_500_000,
    sale_date: '2025-05-02',
    lot_size: 30.0,
    building_sf: 500_000,
    price_per_acre: 983_333,
    buyer: 'Hillwood Development',
    seller: 'Clarion Partners',
    latitude: 34.0223,
    longitude: -117.4117,
  },
  {
    address: '6400 Kimball Ave, Chino, CA 91708',
    sale_price: 22_000_000,
    sale_date: '2025-07-14',
    lot_size: 20.5,
    building_sf: 350_000,
    price_per_acre: 1_073_171,
    buyer: 'EQT Exeter',
    seller: 'Black Creek Group',
    latitude: 33.9945,
    longitude: -117.6732,
  },
  {
    address: '10800 Cedar Ave, Bloomington, CA 92316',
    sale_price: 115_000_000,
    sale_date: '2024-12-20',
    lot_size: 95.0,
    building_sf: 1_800_000,
    price_per_acre: 1_210_526,
    buyer: 'GLP Capital Partners',
    seller: 'Majestic Realty Co',
    latitude: 34.0389,
    longitude: -117.3988,
  },
  {
    address: '5500 Hamner Ave, Eastvale, CA 91752',
    sale_price: 42_000_000,
    sale_date: '2025-02-28',
    lot_size: 38.2,
    building_sf: 620_000,
    price_per_acre: 1_099_476,
    buyer: 'Ares Industrial',
    seller: 'CT Realty',
    latitude: 33.9612,
    longitude: -117.5801,
  },
];

console.log('Comp seed data is applied via Supabase migration.');
console.log(`Reference: ${SEED_COMPS.length} comps documented.`);
