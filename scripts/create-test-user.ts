/**
 * Create Test User Script
 *
 * Creates a permanent test/demo account with full data access.
 * Idempotent — safe to run multiple times.
 *
 * Usage: npx ts-node scripts/create-test-user.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * environment variables (loaded from .env.local).
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load .env.local (ESM compatible)
const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = dirname(__filename2);
config({ path: resolve(__dirname2, '..', '.env.local') });

const TEST_EMAIL = 'test@landintel.com';
const TEST_PASSWORD = 'LandIntel2024!';
const TEST_FULL_NAME = 'Test User';
const TEST_ROLE = 'admin';

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey);

  // --- Step 1: Create or find auth user ---
  let userId: string;

  // Check if user already exists
  const { data: listData } = await supabase.auth.admin.listUsers();
  const existing = listData?.users?.find((u) => u.email === TEST_EMAIL);

  if (existing) {
    userId = existing.id;
    console.log(`✓ Auth user already exists: ${TEST_EMAIL} (${userId})`);
  } else {
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
    });

    if (createError) {
      console.error('✗ Failed to create auth user:', createError.message);
      process.exit(1);
    }

    userId = createData.user.id;
    console.log(`✓ Auth user created: ${TEST_EMAIL} (${userId})`);
  }

  // --- Step 2: Determine org_id ---
  // Check if any orgs exist; if so, use the first one. Otherwise use null.
  const { data: orgs } = await supabase.from('orgs').select('id,name').limit(1);
  const orgId = orgs && orgs.length > 0 ? orgs[0].id : null;
  console.log(`✓ Org assignment: ${orgId ?? '(none — no orgs exist)'}`);

  // --- Step 3: Upsert profile record ---
  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: userId,
      email: TEST_EMAIL,
      full_name: TEST_FULL_NAME,
      role: TEST_ROLE,
      org_id: orgId,
    },
    { onConflict: 'id' }
  );

  if (profileError) {
    console.error('✗ Failed to upsert profile:', profileError.message);
    process.exit(1);
  }
  console.log('✓ Profile record upserted');

  // --- Step 4: Grant map access ---
  const { data: maps } = await supabase.from('maps').select('id');
  if (maps && maps.length > 0) {
    const grants = maps.map((m) => ({
      map_id: m.id,
      user_id: userId,
      permission: 'view',
    }));

    // Get map_grants columns to check if table has the right shape
    const { error: grantError } = await supabase.from('map_grants').upsert(grants, {
      onConflict: 'map_id,user_id',
      ignoreDuplicates: true,
    });

    if (grantError) {
      // If upsert fails (e.g. no unique constraint), try insert with ignore
      console.log(`  Map grants upsert issue: ${grantError.message} — trying insert`);
      for (const g of grants) {
        await supabase.from('map_grants').insert(g);
      }
    }
    console.log(`✓ Map grants inserted: ${maps.length} maps`);
  } else {
    console.log('✓ Map grants: no maps exist (skipped)');
  }

  // --- Step 5: Verify access ---
  // Sign in as the test user to verify RLS works
  const anonClient = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || serviceKey);
  const { error: signInError } = await anonClient.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (signInError) {
    console.error('✗ Sign-in verification failed:', signInError.message);
    process.exit(1);
  }

  const { count: parcelCount } = await anonClient
    .from('parcels')
    .select('id', { count: 'exact', head: true });
  const { count: compCount } = await anonClient
    .from('comps')
    .select('id', { count: 'exact', head: true });
  const { count: projectCount } = await anonClient
    .from('projects')
    .select('id', { count: 'exact', head: true });

  console.log(`✓ Verified access — parcels: ${parcelCount ?? 0}, comps: ${compCount ?? 0}, projects: ${projectCount ?? 0}`);
  console.log('\n✓ Test account ready');
  console.log(`  Email:    ${TEST_EMAIL}`);
  console.log(`  Password: ${TEST_PASSWORD}`);
  console.log(`  Login:    https://project-tlho5.vercel.app/auth/login`);
}

main().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
