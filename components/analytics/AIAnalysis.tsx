'use client';

import { useState, useMemo } from 'react';
import type { Parcel } from '@/types/parcel';
import { useCompStore } from '@/lib/stores/comp-store';

interface AIAnalysisProps {
  /** The parcel to analyze */
  parcel: Parcel;
}

/** Lookup table for common industrial zoning code descriptions */
const ZONING_DESCRIPTIONS: Record<string, string> = {
  'M-1': 'Light Manufacturing/Industrial: Permits light manufacturing, warehousing, distribution facilities, research and development, and limited commercial uses. Typically restricts heavy industrial operations, outdoor storage, and hazardous materials.',
  'M-2': 'General Manufacturing/Industrial: Allows a broad range of manufacturing, processing, warehousing, and distribution uses. May permit some outdoor storage and heavier industrial operations with appropriate setbacks.',
  'M-3': 'Heavy Industrial: Permits heavy manufacturing, processing, and industrial operations including those that may produce noise, odor, or emissions. Typically located away from residential areas.',
  'I-1': 'Light Industrial: Similar to M-1, permits warehousing, distribution, light assembly, and flex space. Generally requires screened outdoor storage and landscaping buffers.',
  'I-2': 'General Industrial: Permits manufacturing, processing, and heavy distribution operations. Allows outdoor storage with screening requirements.',
  'I-3': 'Heavy Industrial: Allows intensive industrial uses including heavy manufacturing, chemical processing, and bulk storage facilities.',
  'C-1': 'Limited Commercial: Permits neighborhood-serving retail and office uses. Industrial uses are generally not permitted.',
  'C-2': 'General Commercial: Allows a wide range of retail, office, and service commercial uses. Limited industrial may be conditionally permitted.',
  'C-3': 'Heavy Commercial: Permits intensive commercial uses including auto-related businesses, wholesale operations, and some light industrial uses.',
  'MU': 'Mixed Use: Allows a combination of residential, commercial, and in some cases light industrial uses within a single development or district.',
  'PD': 'Planned Development: A flexible zoning designation that allows a customized mix of uses based on an approved specific plan or development agreement.',
};

function getZoningDescription(zoning: string | null): string {
  if (!zoning) return 'Zoning information is not available for this parcel.';
  const code = zoning.toUpperCase().trim();
  for (const [key, desc] of Object.entries(ZONING_DESCRIPTIONS)) {
    if (code.includes(key)) return desc;
  }
  return `Zoning code "${zoning}" is not in the standard lookup table. Consult the local jurisdiction for specific permitted uses, development standards, and conditional use provisions.`;
}

function getDevelopmentPotential(parcel: Parcel): string {
  const acreage = parcel.acreage ?? 0;
  const zoning = parcel.zoning ?? 'Unknown';
  const landUse = parcel.land_use ?? 'unspecified land use';

  const sizeDesc =
    acreage >= 40
      ? 'exceptionally large'
      : acreage >= 20
        ? 'large'
        : acreage >= 10
          ? 'mid-size'
          : acreage >= 5
            ? 'modest'
            : 'small';

  const isIndustrial =
    zoning.match(/[MI]-[123]/i) || zoning.includes('MU') || zoning.includes('PD');

  const suitability = isIndustrial
    ? 'well-suited for industrial development including warehousing, distribution, manufacturing, or logistics facilities'
    : 'may require a zone change or conditional use permit for industrial development';

  const sqft = Math.round(acreage * 43560);
  const buildableSf = Math.round(sqft * 0.5);

  return `This ${acreage.toFixed(1)}-acre (${sqft.toLocaleString()} SF) parcel with ${zoning} zoning and ${landUse} is a ${sizeDesc} site that is ${suitability}. At a typical 50% lot coverage ratio, the site could support approximately ${buildableSf.toLocaleString()} SF of building area. ${
    acreage >= 10
      ? 'The site is large enough to accommodate a modern big-box distribution facility with adequate truck court and parking.'
      : 'The site may be suitable for a smaller distribution or flex-industrial building.'
  }`;
}

function getInfrastructureAccess(parcel: Parcel): string {
  const parts: string[] = [];

  if (parcel.flood_zone) {
    const highRisk = ['A', 'AE', 'AH', 'AO', 'V', 'VE'].includes(
      parcel.flood_zone.toUpperCase()
    );
    parts.push(
      highRisk
        ? `The parcel is located in FEMA flood zone ${parcel.flood_zone}, which is a high-risk area. Flood insurance will be required and development may face significant regulatory hurdles, including elevated construction requirements and potential environmental review.`
        : `The parcel is in FEMA flood zone ${parcel.flood_zone}, which is a minimal-risk area. No special flood-related development restrictions are anticipated.`
    );
  } else {
    parts.push(
      'Flood zone data is not available for this parcel. A site-specific flood determination should be obtained prior to development.'
    );
  }

  if (parcel.opportunity_zone) {
    parts.push(
      'This parcel is located within a designated Opportunity Zone, making it eligible for significant tax incentives under the Opportunity Zone program. Qualified investors may defer and potentially reduce capital gains taxes through investment in this area.'
    );
  }

  return parts.join(' ');
}

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({ title, children, defaultOpen = false }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-700">{title}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <div className="px-4 pb-3 text-sm text-gray-600 leading-relaxed">{children}</div>}
    </div>
  );
}

/**
 * AI-powered parcel analysis display.
 * Generates template-based analysis text from parcel data across
 * development potential, zoning, comparable sales, and infrastructure categories.
 */
export default function AIAnalysis({ parcel }: AIAnalysisProps) {
  const analytics = useCompStore((s) => s.analytics);

  const developmentText = useMemo(() => getDevelopmentPotential(parcel), [parcel]);
  const zoningText = useMemo(() => getZoningDescription(parcel.zoning), [parcel.zoning]);
  const infraText = useMemo(() => getInfrastructureAccess(parcel), [parcel]);

  const compSummary = useMemo(() => {
    if (!analytics || analytics.total_count === 0) {
      return 'No comparable sales data is currently available for this area. Load comps from the analytics panel to generate a sales analysis.';
    }
    const median = analytics.median_price_per_acre;
    const avg = analytics.average_price_per_acre;
    const count = analytics.total_count;
    const estimatedValue =
      parcel.acreage != null ? parcel.acreage * median : null;

    return `Based on ${count} comparable sale${count !== 1 ? 's' : ''} in the search area, the median price per acre is $${median.toLocaleString()} and the average is $${avg.toLocaleString()}. Prices range from $${analytics.min_price_per_acre.toLocaleString()} to $${analytics.max_price_per_acre.toLocaleString()} per acre.${
      estimatedValue != null
        ? ` At the median rate, this ${parcel.acreage?.toFixed(1)}-acre parcel would have an estimated land value of approximately $${Math.round(estimatedValue).toLocaleString()}.`
        : ''
    }`;
  }, [analytics, parcel]);

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Parcel Analysis
        </h3>
      </div>

      <CollapsibleSection title="Development Potential" defaultOpen>
        {developmentText}
      </CollapsibleSection>

      <CollapsibleSection title="Zoning Interpretation">
        {zoningText}
      </CollapsibleSection>

      <CollapsibleSection title="Comparable Sales Analysis">
        {compSummary}
      </CollapsibleSection>

      <CollapsibleSection title="Infrastructure Access">
        {infraText}
      </CollapsibleSection>
    </div>
  );
}
