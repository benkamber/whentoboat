'use client';

import { CityProvider } from '@/lib/city-context';
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CityProvider>
      {children}
    </CityProvider>
  );
}
