'use client';

import { type ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Top-level client-side provider wrapper.
 * Currently passes children through; will be extended with auth context, theme providers, etc.
 */
export function Providers({ children }: ProvidersProps) {
  return <>{children}</>;
}
