import { useState, useEffect } from 'react';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShoppingCart,
    Users,
    Eye,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { useAccount } from '../../context/AccountContext';
import api from '../../services/api';

/**
 * MobileAnalytics - Summary analytics dashboard for mobile.
 * 
 * Displays key metrics with trends and sparkline-style indicators.
 */

interface AnalyticsData {
    revenue: { value: number; change: number };
    orders: { value: number; change: number };
    visitors: { value: number; change: number };
    customers: { value: number; change: number };
    conversionRate: { value: number; change: number };
    avgOrderValue: { value: number; change: number };
}

export function MobileAnalytics() {
    const { currentAccount } = useAccount();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');

    useEffect(() => {
        fetchAnalytics();
    }, [currentAccount, period]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const response = await api.get('/stats/analytics', {
                params: { period }
            });

            const stats = response.data;
            setData({
                revenue: {
                    value: stats.revenue || 0,
                    change: stats.revenueChange || 0
                },
                orders: {
                    value: stats.orders || 0,
                    change: stats.ordersChange || 0
                },
                visitors: {
                    value: stats.visitors || 0,
                    change: stats.visitorsChange || 0
                },
                customers: {
                    value: stats.newCustomers || 0,
                    change: stats.customersChange || 0
                },
                conversionRate: {
                    value: stats.conversionRate || 0,
                    change: stats.conversionChange || 0
                },
                avgOrderValue: {
                    value: stats.avgOrderValue || 0,
                    change: stats.aovChange || 0
                }
            });
        } catch (error) {
            console.error('[MobileAnalytics] Error fetching analytics:', error);
            // Set default data on error
            setData({
                revenue: { value: 0, change: 0 },
                orders: { value: 0, change: 0 },
                visitors: { value: 0, change: 0 },
                customers: { value: 0, change: 0 },
                conversionRate: { value: 0, change: 0 },
                avgOrderValue: { value: 0, change: 0 }
            });
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency: 'AUD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const periodLabels = {
        today: 'Today',
        week: 'This Week',
        month: 'This Month'
    };

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3" />
                <div className="flex gap-2">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-10 w-24 bg-gray-200 rounded-full" />
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-32 bg-gray-200 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    const metrics = [
        {
            key: 'revenue',
            label: 'Revenue',
            value: formatCurrency(data?.revenue.value || 0),
            change: data?.revenue.change || 0,
            icon: DollarSign,
            color: 'text-green-600',
            bg: 'bg-green-50'
        },
        {
            key: 'orders',
            label: 'Orders',
            value: formatNumber(data?.orders.value || 0),
            change: data?.orders.change || 0,
            icon: ShoppingCart,
            color: 'text-blue-600',
            bg: 'bg-blue-50'
        },
        {
            key: 'visitors',
            label: 'Visitors',
            value: formatNumber(data?.visitors.value || 0),
            change: data?.visitors.change || 0,
            icon: Eye,
            color: 'text-purple-600',
            bg: 'bg-purple-50'
        },
        {
            key: 'customers',
            label: 'New Customers',
            value: formatNumber(data?.customers.value || 0),
            change: data?.customers.change || 0,
            icon: Users,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50'
        },
        {
            key: 'conversion',
            label: 'Conversion',
            value: `${(data?.conversionRate.value || 0).toFixed(1)}%`,
            change: data?.conversionRate.change || 0,
            icon: TrendingUp,
            color: 'text-orange-600',
            bg: 'bg-orange-50'
        },
        {
            key: 'aov',
            label: 'Avg Order',
            value: formatCurrency(data?.avgOrderValue.value || 0),
            change: data?.avgOrderValue.change || 0,
            icon: DollarSign,
            color: 'text-teal-600',
            bg: 'bg-teal-50'
        }
    ];

    return (
        <div className="space-y-4">
            {/* Header */}
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>

            {/* Period Selector */}
            <div className="flex gap-2">
                {(['today', 'week', 'month'] as const).map((p) => (
                    <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`
                            px-4 py-2 rounded-full text-sm font-medium transition-colors
                            ${period === p
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                            }
                        `}
                    >
                        {periodLabels[p]}
                    </button>
                ))}
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
                {metrics.map((metric) => {
                    const Icon = metric.icon;
                    const isPositive = metric.change >= 0;
                    const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;

                    return (
                        <div
                            key={metric.key}
                            className={`${metric.bg} rounded-xl p-4`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <Icon size={20} className={metric.color} />
                                <div className={`flex items-center text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                    <TrendIcon size={14} />
                                    {Math.abs(metric.change).toFixed(1)}%
                                </div>
                            </div>
                            <p className={`text-2xl font-bold ${metric.color}`}>
                                {metric.value}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                                {metric.label}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
