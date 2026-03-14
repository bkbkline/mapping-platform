import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/parcels
 *
 * Query modes:
 * - `?id=<uuid>` - Single parcel by ID
 * - `?search=<term>` - Search by situs_address, APN, county, or owner
 * - `?limit=...` - Fetch parcels (viewport filtering done client-side via RPC)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);

    const id = searchParams.get('id');
    if (id) {
      const { data, error } = await supabase.from('parcels').select('*').eq('id', id).single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data);
    }

    const search = searchParams.get('search');
    if (search) {
      const { data, error } = await supabase
        .from('parcels')
        .select('*')
        .or(`situs_address.ilike.%${search}%,apn.ilike.%${search}%,county.ilike.%${search}%,owner_name.ilike.%${search}%`)
        .limit(50);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data);
    }

    const limit = parseInt(searchParams.get('limit') ?? '5000', 10);
    const { data, error } = await supabase.from('parcels').select('*').limit(limit);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
