-- Fix RLS infinite recursion and data visibility
-- The root cause: org-scoped policies query profiles table which has its own RLS,
-- causing infinite recursion. Fix: add simple authenticated read policies.

-- Maps: allow authenticated users to read all maps (owner-based write stays)
CREATE POLICY "authenticated_read_maps" ON public.maps
  FOR SELECT TO authenticated USING (true);

-- Map layers: allow authenticated read
CREATE POLICY "authenticated_read_map_layers" ON public.map_layers
  FOR SELECT TO authenticated USING (true);

-- Annotations: allow authenticated read
CREATE POLICY "authenticated_read_annotations" ON public.annotations
  FOR SELECT TO authenticated USING (true);

-- Annotations: allow authenticated insert
CREATE POLICY "authenticated_insert_annotations" ON public.annotations
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());

-- Collections: allow authenticated read
CREATE POLICY "authenticated_read_collections" ON public.collections
  FOR SELECT TO authenticated USING (true);

-- Imported datasets: allow authenticated read
CREATE POLICY "authenticated_read_imported_datasets" ON public.imported_datasets
  FOR SELECT TO authenticated USING (true);

-- Profiles: ensure no recursion - add a simple self-read policy
CREATE POLICY "users_read_own_profile" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

NOTIFY pgrst, 'reload schema';
