import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/parcels
 *
 * Supported query modes:
 * - `?id=<uuid>` - Fetch a single parcel by ID.
 * - `?search=<term>` - Search parcels by address, APN, city, or owner name.
 * - `?west=...&south=...&east=...&north=...&limit=...` - Fetch parcels within a viewport bounding box.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Single parcel by ID
  const id = searchParams.get('id');
  if (id) {
    const { data, error } = await supabaseAdmin
      .from('parcels')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // Search by text
  const search = searchParams.get('search');
  if (search) {
    const { data, error } = await supabaseAdmin
      .from('parcels')
      .select('*')
      .or(
        `address.ilike.%${search}%,apn.ilike.%${search}%,city.ilike.%${search}%,owner_name.ilike.%${search}%`
      )
      .limit(50);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // Viewport bounding-box query
  const west = parseFloat(searchParams.get('west') ?? '-180');
  const south = parseFloat(searchParams.get('south') ?? '-90');
  const east = parseFloat(searchParams.get('east') ?? '180');
  const north = parseFloat(searchParams.get('north') ?? '90');
  const limit = parseInt(searchParams.get('limit') ?? '5000', 10);

  const { data, error } = await supabaseAdmin.rpc('parcels_in_viewport', {
    west,
    south,
    east,
    north,
    row_limit: limit,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
