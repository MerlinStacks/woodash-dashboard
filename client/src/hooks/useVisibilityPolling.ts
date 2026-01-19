import { useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for visibility-aware polling.
 * Pauses polling when the tab is hidden to save resources.
 * 
 * @param callback - The function to call on each poll
 * @param intervalMs - Polling interval in milliseconds
 * @param deps - Dependencies array for the callback
 * 
 * @example
 * useVisibilityPolling(fetchData, 10000, [accountId, token]);
 */
export function useVisibilityPolling(
    callback: () => void | Promise<void>,
    intervalMs: number,
    deps: React.DependencyList = []
): void {
    const savedCallback = useRef(callback);

    // Update ref when callback changes
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    useEffect(() => {
        // Execute immediately if visible
        const executeIfVisible = () => {
            if (document.visibilityState === 'visible') {
                savedCallback.current();
            }
        };

        // Initial fetch if visible
        executeIfVisible();

        // Set up polling interval
        const interval = setInterval(executeIfVisible, intervalMs);

        // Refetch when tab becomes visible again
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                savedCallback.current();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup
        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [intervalMs, ...deps]);
}
