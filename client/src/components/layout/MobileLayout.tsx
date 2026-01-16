import { ReactNode, useState, useEffect, useCallback } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { RefreshCw, WifiOff, Download, X } from 'lucide-react';
import { MobileNav } from './MobileNav';
import { MobileErrorBoundary } from '../mobile/MobileErrorBoundary';
import { OrderNotifications } from '../notifications/OrderNotifications';
import { PWAUpdateModal, usePWAUpdate, PWAUpdateBanner } from '../mobile/PWAUpdateModal';
import { useAuth } from '../../context/AuthContext';
import { useAccount } from '../../context/AccountContext';
import { Logger } from '../../utils/logger';

/**
 * MobileLayout - Premium dark glassmorphism layout for the PWA companion app.
 * 
 * Features:
 * - Dark theme with gradient backgrounds
 * - Glassmorphism cards throughout
 * - Bottom navigation with badge counts
 * - iOS safe areas handling
 * - Pull-to-refresh with visual feedback
 * - Custom install prompt
 * - Haptic feedback where supported
 */

interface MobileLayoutProps {
    children?: ReactNode;
}

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function MobileLayout({ children }: MobileLayoutProps) {
    const location = useLocation();
    const { token } = useAuth();
    const { currentAccount } = useAccount();

    // Pull-to-refresh state
    const [refreshing, setRefreshing] = useState(false);
    const [startY, setStartY] = useState(0);
    const [pullDistance, setPullDistance] = useState(0);

    // Badge counts
    const [inboxBadge, setInboxBadge] = useState(0);
    const [ordersBadge, setOrdersBadge] = useState(0);

    // Network status
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // PWA update system
    const {
        updateAvailable,
        showModal: showUpdateModal,
        updateInfo,
        handleUpdate,
        dismissModal
    } = usePWAUpdate();

    // Install prompt
    const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);

    // Fetch badge counts
    const fetchBadgeCounts = useCallback(async () => {
        if (!token || !currentAccount) return;

        const headers = {
            'Authorization': `Bearer ${token}`,
            'X-Account-ID': currentAccount.id
        };

        try {
            // Fetch unread conversation count
            const convRes = await fetch('/api/chat/unread-count', { headers });
            if (convRes.ok) {
                const data = await convRes.json();
                setInboxBadge(data.count || 0);
            }

            // Fetch pending orders count
            const ordersRes = await fetch('/api/sync/orders/search?limit=1&status=pending', { headers });
            if (ordersRes.ok) {
                const data = await ordersRes.json();
                setOrdersBadge(data.total || 0);
            }
        } catch (error) {
            // Silently fail - badges are enhancement only
        }
    }, [token, currentAccount]);

    useEffect(() => {
        fetchBadgeCounts();
        // Poll every 30 seconds
        const interval = setInterval(fetchBadgeCounts, 30000);
        return () => clearInterval(interval);
    }, [fetchBadgeCounts]);

    // Network status listeners
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Note: PWA update detection is handled by usePWAUpdate hook

    // Install prompt listener
    useEffect(() => {
        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e as BeforeInstallPromptEvent);
            // Check if user hasn't dismissed recently
            const dismissed = localStorage.getItem('pwa-install-dismissed');
            const dismissedTime = dismissed ? parseInt(dismissed) : 0;
            const hoursSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60);
            if (hoursSinceDismissed > 24) {
                setShowInstallBanner(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        };
    }, []);

    // Handle install
    const handleInstall = async () => {
        if (!installPrompt) return;
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowInstallBanner(false);
        }
        setInstallPrompt(null);
    };

    // Dismiss install banner
    const dismissInstallBanner = () => {
        setShowInstallBanner(false);
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    };

    // Handle update tap - force reload to activate new SW
    const handleUpdateTap = () => {
        window.location.reload();
    };

    // Pull-to-refresh handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        if (window.scrollY === 0) {
            setStartY(e.touches[0].clientY);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (startY === 0 || window.scrollY > 0) return;
        const currentY = e.touches[0].clientY;
        const distance = Math.max(0, currentY - startY);
        setPullDistance(Math.min(distance, 120));
    };

    const handleTouchEnd = async () => {
        if (pullDistance > 70) {
            setRefreshing(true);
            // Haptic feedback
            if ('vibrate' in navigator) {
                navigator.vibrate(15);
            }
            // Refresh badge counts
            await fetchBadgeCounts();
            // Dispatch custom event for pages to refresh their data
            window.dispatchEvent(new CustomEvent('mobile-refresh'));
            // Wait a bit for visual feedback
            await new Promise(resolve => setTimeout(resolve, 800));
            setRefreshing(false);
        }
        setStartY(0);
        setPullDistance(0);
    };

    const getActiveTab = () => {
        const path = location.pathname;
        if (path.includes('/m/orders')) return 'orders';
        if (path.includes('/m/inbox')) return 'inbox';
        if (path.includes('/m/analytics')) return 'analytics';
        if (path.includes('/m/more')) return 'more';
        return 'dashboard';
    };

    const pullProgress = Math.min(pullDistance / 70, 1);

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col"
            style={{
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'calc(env(safe-area-inset-bottom) + 64px)'
            }}
        >
            {/* Real-time order notifications via socket */}
            <OrderNotifications />

            {/* Offline Banner */}
            {!isOnline && (
                <div className="bg-amber-500/90 backdrop-blur-sm text-white text-center py-2.5 px-4 flex items-center justify-center gap-2 text-sm font-medium">
                    <WifiOff size={16} />
                    You're offline - some features may be unavailable
                </div>
            )}

            {/* PWA Update Modal */}
            <PWAUpdateModal
                isOpen={showUpdateModal}
                onClose={dismissModal}
                onUpdate={handleUpdate}
                updateInfo={updateInfo}
            />

            {/* PWA Update Available Banner (only if modal not shown) */}
            {updateAvailable && isOnline && !showUpdateModal && (
                <PWAUpdateBanner onTap={handleUpdate} />
            )}

            {/* Install App Banner */}
            {showInstallBanner && installPrompt && (
                <div className="bg-gradient-to-r from-emerald-500/90 to-teal-500/90 backdrop-blur-sm text-white py-3 px-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <Download size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold">Install OverSeek</p>
                            <p className="text-xs text-white/80">Add to home screen for the best experience</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleInstall}
                            className="px-4 py-1.5 bg-white text-emerald-600 rounded-lg text-sm font-semibold hover:bg-white/90 active:scale-95 transition-all"
                        >
                            Install
                        </button>
                        <button
                            onClick={dismissInstallBanner}
                            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Pull-to-refresh indicator */}
            <div
                className={`fixed top-0 left-0 right-0 flex items-center justify-center z-50 transition-all duration-200 ${pullDistance > 0 ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-transparent'
                    }`}
                style={{
                    height: Math.max(pullDistance, 0),
                    paddingTop: 'env(safe-area-inset-top)',
                    opacity: pullProgress
                }}
            >
                <div
                    className={`p-2 rounded-full bg-white/20 backdrop-blur-sm ${refreshing ? 'animate-spin' : ''}`}
                    style={{
                        transform: `rotate(${pullProgress * 360}deg) scale(${0.5 + pullProgress * 0.5})`,
                        transition: refreshing ? 'none' : 'transform 0.1s'
                    }}
                >
                    <RefreshCw size={24} className="text-white" />
                </div>
                {pullProgress >= 1 && !refreshing && (
                    <span className="text-white text-sm ml-3 font-medium">Release to refresh</span>
                )}
                {refreshing && (
                    <span className="text-white text-sm ml-3 font-medium">Refreshing...</span>
                )}
            </div>

            {/* Main content */}
            <main
                className="flex-1 overflow-x-hidden"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className="p-4">
                    <MobileErrorBoundary>
                        {children || <Outlet />}
                    </MobileErrorBoundary>
                </div>
            </main>

            {/* Bottom navigation with badges */}
            <MobileNav
                activeTab={getActiveTab()}
                inboxBadge={inboxBadge}
                ordersBadge={ordersBadge}
            />
        </div>
    );
}
