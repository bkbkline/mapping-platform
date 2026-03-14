'use client';

import { useCompStore } from '@/lib/stores/comp-store';
import {
  formatCurrency,
  formatAcreage,
  formatPricePerAcre,
} from '@/lib/geospatial/utils';

/**
 * Two-column info row for comp details.
 */
function CompInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900 font-medium">{value}</dd>
    </>
  );
}

/**
 * CompDetailCard - Comparable sale detail view for the right panel.
 *
 * Displays the selected comp's details including address, sale price, sale date,
 * lot size, building SF, price per acre, buyer, seller, and coordinates.
 * Below the detail, shows CompAnalytics summary if available: total count,
 * median/average/min/max price per acre, and a list of individual comps.
 */
export default function CompDetailCard() {
  const { selectedComp, analytics } = useCompStore();

  if (!selectedComp) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-sm text-gray-400">Select a comp on the map to view details.</p>
      </div>
    );
  }

  const coordinates = selectedComp.geom
    ? (selectedComp.geom.coordinates as [number, number])
    : null;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-gray-900">
          {selectedComp.address ?? 'No Address'}
        </h3>
        {selectedComp.sale_date && (
          <p className="text-sm text-gray-500">
            Sold {new Date(selectedComp.sale_date).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Comp Details */}
      <div className="border-b border-gray-100 pb-4">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          Sale Details
        </h4>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
          <CompInfoRow
            label="Sale Price"
            value={formatCurrency(selectedComp.sale_price)}
          />
          <CompInfoRow
            label="Sale Date"
            value={selectedComp.sale_date ?? 'N/A'}
          />
          <CompInfoRow
            label="Lot Size"
            value={formatAcreage(selectedComp.lot_size)}
          />
          <CompInfoRow
            label="Building SF"
            value={
              selectedComp.building_sf !== null
                ? selectedComp.building_sf.toLocaleString() + ' SF'
                : 'N/A'
            }
          />
          <CompInfoRow
            label="Price Per Acre"
            value={formatPricePerAcre(selectedComp.price_per_acre)}
          />
          <CompInfoRow
            label="Buyer"
            value={selectedComp.buyer ?? 'N/A'}
          />
          <CompInfoRow
            label="Seller"
            value={selectedComp.seller ?? 'N/A'}
          />
        </dl>
      </div>

      {/* Location */}
      <div className="border-b border-gray-100 pb-4">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          Location
        </h4>
        {coordinates ? (
          <p className="text-sm text-gray-700 font-mono">
            {coordinates[1].toFixed(6)}, {coordinates[0].toFixed(6)}
          </p>
        ) : (
          <p className="text-sm text-gray-400">No location data</p>
        )}
      </div>

      {/* Comp Analytics */}
      {analytics && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Comp Analytics
          </h4>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Total Comps" value={analytics.total_count.toString()} />
            <StatCard
              label="Median $/AC"
              value={formatPricePerAcre(analytics.median_price_per_acre)}
            />
            <StatCard
              label="Average $/AC"
              value={formatPricePerAcre(analytics.average_price_per_acre)}
            />
            <StatCard
              label="Range"
              value={`${formatPricePerAcre(analytics.min_price_per_acre)} - ${formatPricePerAcre(analytics.max_price_per_acre)}`}
            />
          </div>

          {/* Individual Comps List */}
          {analytics.comps.length > 0 && (
            <div>
              <h5 className="mb-2 text-xs font-medium text-gray-500">
                Individual Comps ({analytics.comps.length})
              </h5>
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {analytics.comps.map((comp) => (
                  <li
                    key={comp.id}
                    className="rounded-lg border border-gray-200 p-2.5"
                  >
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {comp.address ?? 'No Address'}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                      <span>{formatCurrency(comp.sale_price)}</span>
                      <span>{formatAcreage(comp.lot_size)}</span>
                      <span>{formatPricePerAcre(comp.price_per_acre)}</span>
                    </div>
                    {comp.sale_date && (
                      <span className="text-xs text-gray-400">
                        {new Date(comp.sale_date).toLocaleDateString()}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Small stat card used in the analytics summary grid.
 */
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}
