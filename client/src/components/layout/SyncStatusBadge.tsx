import { RefreshCw, WifiOff } from 'lucide-react';
import { useSyncStatus } from '../../context/SyncStatusContext';
import { useEffect, useState } from 'react';

export function SyncStatusBadge() {
    const { isSyncing, syncState } = useSyncStatus();
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOffline) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-900/20 text-red-500 rounded-full text-xs font-medium border border-red-500/20">
                <WifiOff size={14} />
                <span>Offline</span>
            </div>
        );
    }

    if (isSyncing) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-900/20 text-blue-500 rounded-full text-xs font-medium border border-blue-500/20 animate-pulse">
                <RefreshCw size={14} className="animate-spin" />
                <span>Syncing...</span>
            </div>
        );
    }

    // Check freshness
    const relevantTypes = ['orders', 'products', 'customers'];
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;

    // Find the oldest sync time among relevant types
    let isBehind = false;
    let hasData = false;

    // Filter to only checking types that actually exist in the state
    const knownStates = syncState.filter(s => relevantTypes.includes(s.entityType));

    if (knownStates.length > 0) {
        hasData = true;
        for (const state of knownStates) {
            if (!state.lastSyncedAt) {
                isBehind = true;
                break;
            }
            const lastSync = new Date(state.lastSyncedAt);
            if (now.getTime() - lastSync.getTime() > oneDay) {
                isBehind = true;
                break;
            }
        }
    }

    if (hasData) {
        return (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${isBehind
                    ? 'bg-amber-900/20 text-amber-500 border-amber-500/20'
                    : 'bg-green-900/20 text-green-500 border-green-500/20'
                }`}>
                <div className={`w-2 h-2 rounded-full ${isBehind ? 'bg-amber-500' : 'bg-green-500'}`} />
                <span>{isBehind ? 'Behind' : 'Up to date'}</span>
            </div>
        );
    }

    return null;
}
