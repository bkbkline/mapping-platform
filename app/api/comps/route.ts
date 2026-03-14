import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/comps
 *
 * Supported query modes:
 * - `?west=...&south=...&east=...&north=...` - Fetch comps within a viewport bounding box.
 * - `?lng=...&lat=...&radius=...` - Fetch comps near a point (radius in meters).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Proximity query
  const lng = searchParams.get('lng');
  const lat = searchParams.get('lat');
  const radius = searchParams.get('radius');

  if (lng && lat && radius) {
    const { data, error } = await supabaseAdmin.rpc('comps_near_point', {
      p_lng: parseFloat(lng),
      p_lat: parseFloat(lat),
      p_radius: parseFloat(radius),
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // Viewport bounding-box query
  const west = parseFloat(searchParams.get('west') ?? '-180');
  const south = parseFloat(searchParams.get('south') ?? '-90');
  const east = parseFloat(searchParams.get('east') ?? '180');
  const north = parseFloat(searchParams.get('north') ?? '90');

  const { data, error } = await supabaseAdmin.rpc('comps_in_viewport', {
    west,
    south,
    east,
    north,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
