'use client';

import { useMemo } from 'react';
import { useCompStore } from '@/lib/stores/comp-store';

const RADIUS_OPTIONS = [1, 2, 5, 10, 25] as const;

function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

interface PriceBucket {
  label: string;
  count: number;
}

/**
 * Analytics summary card for sales comps.
 * Displays total count, median/avg price per acre, price range,
 * a horizontal bar distribution chart, and a radius selector.
 */
export default function CompAnalyticsCard() {
  const analytics = useCompStore((s) => s.analytics);
  const radiusMiles = useCompStore((s) => s.radiusMiles);
  const setRadiusMiles = useCompStore((s) => s.setRadiusMiles);

  const buckets = useMemo<PriceBucket[]>(() => {
    if (!analytics || analytics.comps.length === 0) return [];

    const prices = analytics.comps
      .map((c) => c.price_per_acre)
      .filter((p): p is number => p != null);

    if (prices.length === 0) return [];

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min;

    if (range === 0) {
      return [{ label: formatCurrency(min), count: prices.length }];
    }

    const bucketCount = 5;
    const step = range / bucketCount;
    const result: PriceBucket[] = [];

    for (let i = 0; i < bucketCount; i++) {
      const low = min + step * i;
      const high = min + step * (i + 1);
      const count = prices.filter(
        (p) => (i === bucketCount - 1 ? p >= low && p <= high : p >= low && p < high)
      ).length;
      result.push({
        label: `${formatCurrency(low)} - ${formatCurrency(high)}`,
        count,
      });
    }

    return result;
  }, [analytics]);

  const maxBucketCount = useMemo(
    () => Math.max(1, ...buckets.map((b) => b.count)),
    [buckets]
  );

  if (!analytics) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Comp Analytics
        </h3>
        <p className="text-sm text-gray-400">No comp data available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Comp Analytics
      </h3>

      {/* Total comps */}
      <div className="mb-4">
        <p className="text-3xl font-bold text-gray-900">{analytics.total_count}</p>
        <p className="text-xs text-gray-500">Total Comps</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-lg font-semibold text-gray-800">
            {formatCurrency(analytics.median_price_per_acre)}
          </p>
          <p className="text-xs text-gray-500">Median $/AC</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-800">
            {formatCurrency(analytics.average_price_per_acre)}
          </p>
          <p className="text-xs text-gray-500">Average $/AC</p>
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-1">Price Range ($/AC)</p>
        <p className="text-sm font-medium text-gray-700">
          {formatCurrency(analytics.min_price_per_acre)} &mdash;{' '}
          {formatCurrency(analytics.max_price_per_acre)}
        </p>
      </div>

      {/* Distribution */}
      {buckets.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Price Distribution</p>
          <div className="space-y-1.5">
            {buckets.map((bucket) => (
              <div key={bucket.label} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-28 truncate" title={bucket.label}>
                  {bucket.label}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full transition-all"
                    style={{
                      width: `${(bucket.count / maxBucketCount) * 100}%`,
                      minWidth: bucket.count > 0 ? '4px' : '0px',
                    }}
                  />
                </div>
                <span className="text-xs text-gray-600 w-6 text-right">{bucket.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Radius Selector */}
      <div>
        <p className="text-xs text-gray-500 mb-2">Search Radius</p>
        <div className="flex gap-1.5">
          {RADIUS_OPTIONS.map((r) => (
            <button
              key={r}
              onClick={() => setRadiusMiles(r)}
              className={`flex-1 text-xs py-1.5 rounded font-medium transition-colors ${
                radiusMiles === r
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {r} mi
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
