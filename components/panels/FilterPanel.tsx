'use client';

import { useState, useCallback } from 'react';
import { useParcelStore } from '@/lib/stores/parcel-store';
import { useCompStore } from '@/lib/stores/comp-store';
import type { ParcelFilters } from '@/types/parcel';
import type { CompFilters } from '@/types/comps';

/** Zoning codes available for filtering */
const ZONING_OPTIONS = ['M-1', 'M-2', 'M-3', 'I-1', 'I-2', 'C-1', 'C-2', 'C-3', 'MU'] as const;

/** Flood zone options for the dropdown */
const FLOOD_ZONE_OPTIONS = ['Any', 'X', 'AE', 'A', 'V'] as const;

/**
 * FilterPanel - Advanced filter controls for parcels and comps.
 *
 * Can be rendered as a modal overlay or embedded section within the left panel.
 * Provides parcel filters (acreage range, zoning type multi-select, jurisdiction,
 * flood zone, opportunity zone, assessed value range) and comp filters (sale date
 * range, price range, price per acre range). Includes Apply and Reset buttons.
 */
export default function FilterPanel({ onClose }: { onClose?: () => void }) {
  const { filters: currentParcelFilters, setFilters: setParcelFilters } = useParcelStore();
  const { filters: currentCompFilters, setFilters: setCompFilters } = useCompStore();

  // Parcel filter local state
  const [acreageMin, setAcreageMin] = useState<string>(
    currentParcelFilters.acreage_min?.toString() ?? ''
  );
  const [acreageMax, setAcreageMax] = useState<string>(
    currentParcelFilters.acreage_max?.toString() ?? ''
  );
  const [selectedZonings, setSelectedZonings] = useState<string[]>(
    currentParcelFilters.zoning_types ?? []
  );
  const [jurisdiction, setJurisdiction] = useState(
    currentParcelFilters.jurisdiction ?? ''
  );
  const [floodZone, setFloodZone] = useState(
    currentParcelFilters.flood_zone ?? 'Any'
  );
  const [opportunityZone, setOpportunityZone] = useState(
    currentParcelFilters.opportunity_zone ?? false
  );
  const [assessedValueMin, setAssessedValueMin] = useState<string>(
    currentParcelFilters.assessed_value_min?.toString() ?? ''
  );
  const [assessedValueMax, setAssessedValueMax] = useState<string>(
    currentParcelFilters.assessed_value_max?.toString() ?? ''
  );

  // Comp filter local state
  const [saleDateStart, setSaleDateStart] = useState(
    currentCompFilters.sale_date_start ?? ''
  );
  const [saleDateEnd, setSaleDateEnd] = useState(
    currentCompFilters.sale_date_end ?? ''
  );
  const [priceMin, setPriceMin] = useState<string>(
    currentCompFilters.price_min?.toString() ?? ''
  );
  const [priceMax, setPriceMax] = useState<string>(
    currentCompFilters.price_max?.toString() ?? ''
  );
  const [ppaMin, setPpaMin] = useState<string>(
    currentCompFilters.price_per_acre_min?.toString() ?? ''
  );
  const [ppaMax, setPpaMax] = useState<string>(
    currentCompFilters.price_per_acre_max?.toString() ?? ''
  );

  const handleZoningToggle = useCallback((code: string) => {
    setSelectedZonings((prev) =>
      prev.includes(code) ? prev.filter((z) => z !== code) : [...prev, code]
    );
  }, []);

  const handleApply = useCallback(() => {
    const parcelFilters: Partial<ParcelFilters> = {
      acreage_min: acreageMin ? parseFloat(acreageMin) : undefined,
      acreage_max: acreageMax ? parseFloat(acreageMax) : undefined,
      zoning_types: selectedZonings.length > 0 ? selectedZonings : undefined,
      jurisdiction: jurisdiction || undefined,
      flood_zone: floodZone !== 'Any' ? floodZone : undefined,
      opportunity_zone: opportunityZone || undefined,
      assessed_value_min: assessedValueMin ? parseFloat(assessedValueMin) : undefined,
      assessed_value_max: assessedValueMax ? parseFloat(assessedValueMax) : undefined,
    };

    const compFilters: Partial<CompFilters> = {
      sale_date_start: saleDateStart || undefined,
      sale_date_end: saleDateEnd || undefined,
      price_min: priceMin ? parseFloat(priceMin) : undefined,
      price_max: priceMax ? parseFloat(priceMax) : undefined,
      price_per_acre_min: ppaMin ? parseFloat(ppaMin) : undefined,
      price_per_acre_max: ppaMax ? parseFloat(ppaMax) : undefined,
    };

    setParcelFilters(parcelFilters);
    setCompFilters(compFilters);
    onClose?.();
  }, [
    acreageMin, acreageMax, selectedZonings, jurisdiction, floodZone,
    opportunityZone, assessedValueMin, assessedValueMax,
    saleDateStart, saleDateEnd, priceMin, priceMax, ppaMin, ppaMax,
    setParcelFilters, setCompFilters, onClose,
  ]);

  const handleReset = useCallback(() => {
    // Reset local state
    setAcreageMin('');
    setAcreageMax('');
    setSelectedZonings([]);
    setJurisdiction('');
    setFloodZone('Any');
    setOpportunityZone(false);
    setAssessedValueMin('');
    setAssessedValueMax('');
    setSaleDateStart('');
    setSaleDateEnd('');
    setPriceMin('');
    setPriceMax('');
    setPpaMin('');
    setPpaMax('');

    // Reset stores
    setParcelFilters({
      acreage_min: undefined,
      acreage_max: undefined,
      zoning_types: undefined,
      jurisdiction: undefined,
      flood_zone: undefined,
      opportunity_zone: undefined,
      assessed_value_min: undefined,
      assessed_value_max: undefined,
      search_query: undefined,
    });
    setCompFilters({
      sale_date_start: undefined,
      sale_date_end: undefined,
      price_min: undefined,
      price_max: undefined,
      price_per_acre_min: undefined,
      price_per_acre_max: undefined,
    });
  }, [setParcelFilters, setCompFilters]);

  return (
    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">Advanced Filters</h2>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Close filter panel"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="px-6 py-4 space-y-6">
        {/* Parcel Filters */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Parcel Filters</h3>

          {/* Acreage Range */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Acreage Range
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={acreageMin}
                onChange={(e) => setAcreageMin(e.target.value)}
                placeholder="Min"
                step="0.1"
                min="0"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-gray-400 text-sm">to</span>
              <input
                type="number"
                value={acreageMax}
                onChange={(e) => setAcreageMax(e.target.value)}
                placeholder="Max"
                step="0.1"
                min="0"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Zoning Type */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Zoning Type
            </label>
            <div className="flex flex-wrap gap-2">
              {ZONING_OPTIONS.map((code) => (
                <label
                  key={code}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    selectedZonings.includes(code)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedZonings.includes(code)}
                    onChange={() => handleZoningToggle(code)}
                    className="sr-only"
                  />
                  {code}
                </label>
              ))}
            </div>
          </div>

          {/* Jurisdiction */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Jurisdiction
            </label>
            <input
              type="text"
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value)}
              placeholder="Enter jurisdiction..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Flood Zone */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Flood Zone
            </label>
            <select
              value={floodZone}
              onChange={(e) => setFloodZone(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {FLOOD_ZONE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Opportunity Zone */}
          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={opportunityZone}
                onChange={(e) => setOpportunityZone(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Opportunity Zone Only</span>
            </label>
          </div>

          {/* Assessed Value Range */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Assessed Value Range
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={assessedValueMin}
                onChange={(e) => setAssessedValueMin(e.target.value)}
                placeholder="Min ($)"
                min="0"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-gray-400 text-sm">to</span>
              <input
                type="number"
                value={assessedValueMax}
                onChange={(e) => setAssessedValueMax(e.target.value)}
                placeholder="Max ($)"
                min="0"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-gray-200" />

        {/* Comp Filters */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Comp Filters</h3>

          {/* Sale Date Range */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Sale Date Range
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={saleDateStart}
                onChange={(e) => setSaleDateStart(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-gray-400 text-sm">to</span>
              <input
                type="date"
                value={saleDateEnd}
                onChange={(e) => setSaleDateEnd(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Price Range */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Price Range
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                placeholder="Min ($)"
                min="0"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-gray-400 text-sm">to</span>
              <input
                type="number"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                placeholder="Max ($)"
                min="0"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Price Per Acre Range */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Price Per Acre Range
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={ppaMin}
                onChange={(e) => setPpaMin(e.target.value)}
                placeholder="Min ($/AC)"
                min="0"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-gray-400 text-sm">to</span>
              <input
                type="number"
                value={ppaMax}
                onChange={(e) => setPpaMax(e.target.value)}
                placeholder="Max ($/AC)"
                min="0"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
        <button
          type="button"
          onClick={handleReset}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={handleApply}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}
