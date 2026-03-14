'use client';

import type { SuitabilityBreakdown } from '@/types/parcel';

interface SuitabilityScoreProps {
  /** Overall score 0-100 */
  score: number;
  /** Breakdown of individual scoring categories */
  breakdown: SuitabilityBreakdown;
  /** Display size variant */
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CONFIG = {
  sm: { svgSize: 80, strokeWidth: 6, fontSize: 'text-lg' },
  md: { svgSize: 120, strokeWidth: 8, fontSize: 'text-2xl' },
  lg: { svgSize: 160, strokeWidth: 10, fontSize: 'text-3xl' },
} as const;

interface BreakdownRow {
  label: string;
  key: keyof SuitabilityBreakdown;
  max: number;
}

const BREAKDOWN_ROWS: BreakdownRow[] = [
  { label: 'Acreage', key: 'acreage_score', max: 25 },
  { label: 'Zoning', key: 'zoning_score', max: 25 },
  { label: 'Highway', key: 'highway_proximity_score', max: 15 },
  { label: 'Rail', key: 'rail_access_score', max: 10 },
  { label: 'Flood Zone', key: 'flood_zone_score', max: 15 },
  { label: 'Infrastructure', key: 'infrastructure_score', max: 10 },
];

function getScoreColor(score: number): string {
  if (score < 30) return '#EF4444';
  if (score <= 60) return '#F59E0B';
  return '#10B981';
}

/**
 * Circular score display component with SVG donut chart and breakdown bars.
 * Color ranges: red (<30), yellow (30-60), green (>60).
 */
export default function SuitabilityScore({
  score,
  breakdown,
  size = 'md',
}: SuitabilityScoreProps) {
  const { svgSize, strokeWidth, fontSize } = SIZE_CONFIG[size];
  const radius = (svgSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, score)) / 100;
  const dashOffset = circumference * (1 - progress);
  const color = getScoreColor(score);

  return (
    <div className="flex flex-col items-center">
      {/* Donut chart */}
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg
          width={svgSize}
          height={svgSize}
          className="-rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        {/* Score text centered */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${fontSize} font-bold`} style={{ color }}>
            {Math.round(score)}
          </span>
        </div>
      </div>

      {/* Breakdown bars */}
      <div className="w-full mt-4 space-y-2">
        {BREAKDOWN_ROWS.map((row) => {
          const value = breakdown[row.key];
          const pct = (value / row.max) * 100;
          return (
            <div key={row.key}>
              <div className="flex items-center justify-between text-xs mb-0.5">
                <span className="text-gray-600">{row.label}</span>
                <span className="text-gray-500">
                  {value}/{row.max}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: getScoreColor((pct / 100) * 100),
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
