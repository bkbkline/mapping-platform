export type ItemGeometry = 'point' | 'line' | 'polygon';

export interface MapItem {
  id: string;
  name: string;
  geometry: ItemGeometry;
  color: string;
}

export const INDUSTRIAL_ITEMS: MapItem[] = [
  { id: 'building', name: 'Building', geometry: 'point', color: '#3B82F6' },
  { id: 'warehouse', name: 'Warehouse', geometry: 'point', color: '#3B82F6' },
  { id: 'loading-dock', name: 'Loading Dock', geometry: 'point', color: '#6B7280' },
  { id: 'gate', name: 'Gate / Entry', geometry: 'point', color: '#6B7280' },
  { id: 'parking', name: 'Parking', geometry: 'point', color: '#6B7280' },
  { id: 'utility', name: 'Utility', geometry: 'point', color: '#EAB308' },
  { id: 'photo-point', name: 'Photo Point', geometry: 'point', color: '#8B5CF6' },
  { id: 'marker', name: 'Marker', geometry: 'point', color: '#F59E0B' },
  { id: 'road', name: 'Road / Drive', geometry: 'line', color: '#6B7280' },
  { id: 'fence', name: 'Fence', geometry: 'line', color: '#92400E' },
  { id: 'rail-spur', name: 'Rail Spur', geometry: 'line', color: '#7C3AED' },
  { id: 'pipeline', name: 'Pipeline', geometry: 'line', color: '#DC2626' },
  { id: 'distance', name: 'Distance', geometry: 'line', color: '#3B82F6' },
  { id: 'site-boundary', name: 'Site Boundary', geometry: 'polygon', color: '#F97316' },
  { id: 'building-footprint', name: 'Building Footprint', geometry: 'polygon', color: '#3B82F6' },
  { id: 'land-sale-comp', name: 'Land Sale Comp', geometry: 'polygon', color: '#10B981' },
  { id: 'lease-comp', name: 'Lease Comp', geometry: 'polygon', color: '#8B5CF6' },
  { id: 'competitive-dev', name: 'Competitive Dev', geometry: 'polygon', color: '#EF4444' },
  { id: 'tenant-in-market', name: 'Tenant in Market', geometry: 'polygon', color: '#F59E0B' },
  { id: 'prospect-site', name: 'Prospect Site', geometry: 'polygon', color: '#06B6D4' },
  { id: 'zone-area', name: 'Zoning Area', geometry: 'polygon', color: '#6366F1' },
];
