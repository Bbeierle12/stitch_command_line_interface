/**
 * Lazy Loaded Routes
 * Code-split routes for better performance
 */

import { lazy, Suspense } from 'react';
import { LoadingState } from '../components/LoadingState';

// Lazy load page components
export const DashboardPage = lazy(() => 
  import('../pages/DashboardPage').then(m => ({ default: m.DashboardPage }))
);

export const PreviewPage = lazy(() => 
  import('../pages/PreviewPage').then(m => ({ default: m.PreviewPage }))
);

export const EditorPage = lazy(() => 
  import('../pages/EditorPage').then(m => ({ default: m.EditorPage }))
);

export const CiPage = lazy(() => 
  import('../pages/CiPage').then(m => ({ default: m.CiPage }))
);

export const SecurityPage = lazy(() => 
  import('../pages/SecurityPage').then(m => ({ default: m.SecurityPage }))
);

export const SystemPage = lazy(() => 
  import('../pages/SystemPage').then(m => ({ default: m.SystemPage }))
);

export const NetworkPage = lazy(() => 
  import('../pages/NetworkPage').then(m => ({ default: m.NetworkPage }))
);

export const InboxPage = lazy(() => 
  import('../pages/InboxPage').then(m => ({ default: m.InboxPage }))
);

/**
 * Wrapper component for lazy routes with loading state
 */
export function LazyRoute({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingState message="Loading page..." />}>
      {children}
    </Suspense>
  );
}
