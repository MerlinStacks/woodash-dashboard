import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShoppingCart,
    MessageSquare,
    TrendingUp,
    Package,
    ArrowRight,
    Bell,
    DollarSign
} from 'lucide-react';
import { useAccount } from '../../context/AccountContext';
import api from '../../services/api';

/**
 * MobileDashboard - Main dashboard for the PWA companion app.
 * 
 * Displays:
 * - Today's key metrics (orders, revenue, messages)
 * - Quick action buttons
 * - Recent activity feed
 */

interface DashboardStats {
    todayOrders: number;
    todayRevenue: number;
    pendingMessages: number;
    lowStockItems: number;
}

interface RecentActivity {
    id: string;
    type: 'order' | 'message' | 'inventory';
    title: string;
    subtitle: string;
    time: string;
}

export function MobileDashboard() {
    const navigate = useNavigate();
    const { currentAccount } = useAccount();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [activities, setActivities] = useState<RecentActivity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, [currentAccount]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [statsRes, ordersRes] = await Promise.all([
                api.get('/stats/dashboard'),
                api.get('/orders?limit=5&sort=createdAt:desc')
            ]);

            setStats({
                todayOrders: statsRes.data.todayOrders || 0,
                todayRevenue: statsRes.data.todayRevenue || 0,
                pendingMessages: statsRes.data.pendingMessages || 0,
                lowStockItems: statsRes.data.lowStockItems || 0
            });

            // Transform recent orders into activity feed
            const recentActivities: RecentActivity[] = (ordersRes.data.orders || [])
                .slice(0, 5)
                .map((order: any) => ({
                    id: order.id,
                    type: 'order' as const,
                    title: `Order #${order.orderNumber || order.id.slice(-6)}`,
                    subtitle: `$${order.total?.toFixed(2) || '0.00'} - ${order.status || 'pending'}`,
                    time: formatTimeAgo(order.createdAt)
                }));

            setActivities(recentActivities);
        } catch (error) {
            console.error('[MobileDashboard] Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTimeAgo = (date: string) => {
        const now = new Date();
        const then = new Date(date);
        const diff = Math.floor((now.getTime() - then.getTime()) / 1000);

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency: 'AUD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const quickActions = [
        { label: 'Orders', icon: ShoppingCart, path: '/m/orders', color: 'bg-blue-500' },
        { label: 'Inbox', icon: MessageSquare, path: '/m/inbox', color: 'bg-green-500' },
        { label: 'Analytics', icon: TrendingUp, path: '/m/analytics', color: 'bg-purple-500' },
        { label: 'Inventory', icon: Package, path: '/m/inventory', color: 'bg-orange-500' },
    ];

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/2" />
                <div className="grid grid-cols-2 gap-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-24 bg-gray-200 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-sm text-gray-500">Welcome back!</p>
                </div>
                <button
                    onClick={() => navigate('/m/more')}
                    className="p-2 rounded-full bg-gray-100"
                >
                    <Bell size={20} className="text-gray-600" />
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
                <StatCard
                    label="Today's Orders"
                    value={stats?.todayOrders || 0}
                    icon={ShoppingCart}
                    color="text-blue-600"
                    bgColor="bg-blue-50"
                />
                <StatCard
                    label="Today's Revenue"
                    value={formatCurrency(stats?.todayRevenue || 0)}
                    icon={DollarSign}
                    color="text-green-600"
                    bgColor="bg-green-50"
                />
                <StatCard
                    label="Messages"
                    value={stats?.pendingMessages || 0}
                    icon={MessageSquare}
                    color="text-purple-600"
                    bgColor="bg-purple-50"
                    badge={stats?.pendingMessages ? stats.pendingMessages : undefined}
                />
                <StatCard
                    label="Low Stock"
                    value={stats?.lowStockItems || 0}
                    icon={Package}
                    color="text-orange-600"
                    bgColor="bg-orange-50"
                    badge={stats?.lowStockItems ? stats.lowStockItems : undefined}
                />
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Quick Actions</h2>
                <div className="grid grid-cols-4 gap-3">
                    {quickActions.map((action) => (
                        <button
                            key={action.label}
                            onClick={() => navigate(action.path)}
                            className="flex flex-col items-center p-3 bg-white rounded-xl shadow-sm border border-gray-100 active:scale-95 transition-transform"
                        >
                            <div className={`p-2 rounded-lg ${action.color} mb-2`}>
                                <action.icon size={20} className="text-white" />
                            </div>
                            <span className="text-xs font-medium text-gray-700">{action.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Recent Activity */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase">Recent Activity</h2>
                    <button
                        onClick={() => navigate('/m/orders')}
                        className="text-sm text-indigo-600 font-medium flex items-center gap-1"
                    >
                        View All <ArrowRight size={14} />
                    </button>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                    {activities.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                            No recent activity
                        </div>
                    ) : (
                        activities.map((activity) => (
                            <button
                                key={activity.id}
                                onClick={() => navigate(`/m/orders/${activity.id}`)}
                                className="w-full flex items-center p-4 text-left active:bg-gray-50"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">{activity.title}</p>
                                    <p className="text-sm text-gray-500 truncate">{activity.subtitle}</p>
                                </div>
                                <span className="text-xs text-gray-400 ml-2">{activity.time}</span>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

interface StatCardProps {
    label: string;
    value: number | string;
    icon: typeof ShoppingCart;
    color: string;
    bgColor: string;
    badge?: number;
}

function StatCard({ label, value, icon: Icon, color, bgColor, badge }: StatCardProps) {
    return (
        <div className={`${bgColor} rounded-xl p-4 relative`}>
            <div className="flex items-center justify-between mb-2">
                <Icon size={20} className={color} />
                {badge && badge > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {badge}
                    </span>
                )}
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-600 mt-1">{label}</p>
        </div>
    );
}
