import React, { useEffect, useState } from 'react';
import { useAccount } from '../context/AccountContext';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { TrendingUp, DollarSign, MousePointer2, Megaphone, Lightbulb } from 'lucide-react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import './Marketing.css';

const MarketingPage = () => {
    const { activeAccount } = useAccount();
    const [connectStatus, setConnectStatus] = useState({ meta: false, google: false });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkStatus = async () => {
            if (!activeAccount) return;
            try {
                const { data } = await axios.get('/api/marketing/integrations');
                setConnectStatus({
                    meta: data.some((i: any) => i.platform === 'meta' && i.status === 'active'),
                    google: data.some((i: any) => i.platform === 'google' && i.status === 'active')
                });
            } catch (e) {
                console.error("Failed to fetch marketing status", e);
            } finally {
                setLoading(false);
            }
        };
        checkStatus();
    }, [activeAccount]);

    // Mock Data for UI demonstration
    const data = [
        { name: 'Mon', spend: 400, revenue: 2400 },
        { name: 'Tue', spend: 300, revenue: 1398 },
        { name: 'Wed', spend: 200, revenue: 9800 },
        { name: 'Thu', spend: 278, revenue: 3908 },
        { name: 'Fri', spend: 189, revenue: 4800 },
        { name: 'Sat', spend: 239, revenue: 3800 },
        { name: 'Sun', spend: 349, revenue: 4300 },
    ];

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    if (!connectStatus.meta && !connectStatus.google) {
        return (
            <div className="p-8 text-center animate-fade-in flex flex-col items-center justify-center min-h-[50vh]">
                <Megaphone size={64} className="text-primary mb-4" />
                <h2 className="text-2xl font-bold mb-2">Connect Your Ad Platforms</h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                    To see AI-driven insights and revenue tracking, please connect your Meta Ads or Google Ads account in Settings.
                </p>
                <Link to="/settings">
                    <Button>Go to Settings</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="marketing-page animate-fade-in p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Marketing Intelligence</h1>
                    <p className="text-muted-foreground">Real-time ad performance and AI optimization suggestions.</p>
                </div>
                <div className="flex gap-2">
                    {connectStatus.meta && <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">Meta Active</span>}
                    {connectStatus.google && <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">Google Active</span>}
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card p-6 rounded-lg border shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <DollarSign size={24} />
                        </div>
                        <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-medium">Start</span>
                    </div>
                    <h3 className="text-sm font-medium text-muted-foreground">Total Ad Spend</h3>
                    <div className="text-2xl font-bold mt-1">$1,955</div>
                </div>
                <div className="bg-card p-6 rounded-lg border shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                            <TrendingUp size={24} />
                        </div>
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-medium">+12%</span>
                    </div>
                    <h3 className="text-sm font-medium text-muted-foreground">Total Revenue (ROAS 4.2)</h3>
                    <div className="text-2xl font-bold mt-1">$8,210</div>
                </div>
                <div className="bg-card p-6 rounded-lg border shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                            <MousePointer2 size={24} />
                        </div>
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-medium">+0.2%</span>
                    </div>
                    <h3 className="text-sm font-medium text-muted-foreground">CTR (Click Through Rate)</h3>
                    <div className="text-2xl font-bold mt-1">1.8%</div>
                </div>
            </div>

            {/* AI Suggestions Grid */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Lightbulb className="text-yellow-400" size={20} />
                    AI Optimization Suggestions
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-orange-200 bg-orange-50 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-orange-900">Low Inventory Warning</h4>
                            <span className="bg-orange-200 text-orange-800 text-xs px-2 py-1 rounded">Action Needed</span>
                        </div>
                        <p className="text-sm text-orange-800 mb-4">
                            Campaign <strong>"Summer Sale 2025"</strong> is driving traffic to <strong>Striped T-Shirt</strong> which has only 5 units left.
                        </p>
                        <Button variant="secondary" size="sm">Pause Ad Set</Button>
                    </div>

                    <div className="border border-blue-200 bg-blue-50 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-blue-900">High Margin Opportunity</h4>
                            <span className="bg-blue-200 text-blue-800 text-xs px-2 py-1 rounded">Opportunity</span>
                        </div>
                        <p className="text-sm text-blue-800 mb-4">
                            Product <strong>"Premium Leather Bag"</strong> has a high margin (60%) and positive reviews (4.8/5). Increase ad budget?
                        </p>
                        <Button size="sm">Increase Budget by 20%</Button>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="bg-card p-6 rounded-lg border shadow-sm h-[400px]">
                <h3 className="font-semibold mb-4">Ad Spend vs Revenue</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', borderRadius: '8px' }}
                            itemStyle={{ color: 'var(--foreground)' }}
                        />
                        <Line type="monotone" dataKey="spend" stroke="#ef4444" strokeWidth={2} name="Ad Spend" />
                        <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default MarketingPage;
