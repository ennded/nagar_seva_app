import { useEffect } from 'react';

/**
 * Re-runs `refetch` whenever the tab regains focus/visibility. Apollo's
 * `cache-and-network` policy only hits the network on mount/variable change,
 * so a request left open in a background tab while someone else (e.g. an
 * officer) changes its status would otherwise keep showing stale data until
 * the page is manually reloaded.
 */
export function useRefetchOnFocus(refetch: () => void) {
  useEffect(() => {
    function handleFocus() {
      if (document.visibilityState === 'visible') refetch();
    }
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [refetch]);
}
