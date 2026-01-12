import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    ShoppingCart,
    Inbox,
    BarChart3,
    MoreHorizontal
} from 'lucide-react';

/**
 * MobileNav - Bottom navigation bar for the PWA.
 * 
 * Features:
 * - 5 primary navigation items
 * - Active state indication
 * - Badge support for notifications
 * - Haptic feedback on tap
 */

interface MobileNavProps {
    activeTab: string;
    ordersBadge?: number;
    inboxBadge?: number;
}

interface NavItem {
    id: string;
    label: string;
    path: string;
    icon: typeof LayoutDashboard;
}

const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Home', path: '/m/dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', path: '/m/orders', icon: ShoppingCart },
    { id: 'inbox', label: 'Inbox', path: '/m/inbox', icon: Inbox },
    { id: 'analytics', label: 'Analytics', path: '/m/analytics', icon: BarChart3 },
    { id: 'more', label: 'More', path: '/m/more', icon: MoreHorizontal },
];

export function MobileNav({ activeTab, ordersBadge, inboxBadge }: MobileNavProps) {
    const navigate = useNavigate();

    const handleNavClick = (path: string) => {
        // Haptic feedback
        if ('vibrate' in navigator) {
            navigator.vibrate(5);
        }
        navigate(path);
    };

    const getBadge = (id: string): number | undefined => {
        if (id === 'orders') return ordersBadge;
        if (id === 'inbox') return inboxBadge;
        return undefined;
    };

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <div className="flex items-center justify-around h-16">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const badge = getBadge(item.id);
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.id}
                            onClick={() => handleNavClick(item.path)}
                            className={`
                                flex flex-col items-center justify-center flex-1 h-full
                                transition-colors relative
                                ${isActive
                                    ? 'text-indigo-600'
                                    : 'text-gray-500 active:text-gray-700'
                                }
                            `}
                        >
                            <div className="relative">
                                <Icon
                                    size={24}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                                {badge !== undefined && badge > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                                        {badge > 99 ? '99+' : badge}
                                    </span>
                                )}
                            </div>
                            <span className={`text-xs mt-1 ${isActive ? 'font-medium' : ''}`}>
                                {item.label}
                            </span>
                            {isActive && (
                                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-indigo-600 rounded-full" />
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
