
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAccount } from '../context/AccountContext';
import { Globe, LayoutDashboard, Link, FileText, MousePointer, LogOut, LogIn, History, Search, X, Menu, AlertTriangle } from 'lucide-react';
import { LiveSession } from '../types/analytics';
import { VisitorsTable } from '../components/analytics/VisitorsTable';
import { ReportsTable } from '../components/analytics/ReportsTable';
import { AnalyticsOverview } from '../components/analytics/AnalyticsOverview';
import { UrlBuilder } from '../components/analytics/UrlBuilder';
import { RoadblocksView } from '../components/analytics/RoadblocksView';

// Sidebar Menu Items
const MENUS = [
    {
        title: 'Acquisition',
        items: [
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'realtime', label: 'Real-time Log', icon: History },
            { id: 'channels', label: 'Channels', icon: Globe },
            { id: 'campaigns', label: 'Campaigns', icon: MousePointer },
            { id: 'url-builder', label: 'URL Builder', icon: Link },
        ]
    },
    {
        title: 'Behaviour',
        items: [
            { id: 'pages', label: 'Pages', icon: FileText },
            { id: 'entry', label: 'Entry Pages', icon: LogIn },
            { id: 'exit', label: 'Exit Pages', icon: LogOut },
            { id: 'roadblocks', label: 'Roadblocks', icon: AlertTriangle },
            { id: 'search', label: 'Site Search', icon: Search },
        ]
    }
];


export function LiveAnalyticsPage() {
    const { token } = useAuth();
    const { currentAccount } = useAccount();

    const [activeView, setActiveView] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Live Data (Shared)
    const [visitors, setVisitors] = useState<LiveSession[]>([]);
    const [carts, setCarts] = useState<LiveSession[]>([]);
    // const [loadingLive, setLoadingLive] = useState(true); // Unused for now, or use in UI?

    // Report Data (Generic)
    const [reportData, setReportData] = useState<any[]>([]);
    const [loadingReport, setLoadingReport] = useState(false);

    // Date Range (Simple for now: today, 7d, 30d) - Defaults to 30d
    const [dateRange, setDateRange] = useState('30d');

    useEffect(() => {
        if (!currentAccount || !token) return;

        // Poll Live Data regardless of view
        fetchLiveData();
        const interval = setInterval(fetchLiveData, 5000);

        return () => clearInterval(interval);
    }, [currentAccount, token]);

    useEffect(() => {
        // Fetch Report Data when view changes
        if (activeView !== 'overview' && activeView !== 'realtime' && activeView !== 'url-builder') {
            fetchReport(activeView);
        }
    }, [activeView, dateRange, currentAccount]);

    async function fetchLiveData() {
        try {
            const [vRes, cRes] = await Promise.all([
                fetch('/api/tracking/live', { headers: { Authorization: `Bearer ${token}`, 'x-account-id': currentAccount!.id } }),
                fetch('/api/tracking/carts', { headers: { Authorization: `Bearer ${token}`, 'x-account-id': currentAccount!.id } })
            ]);
            if (vRes.ok) setVisitors(await vRes.json());
            if (cRes.ok) setCarts(await cRes.json());
        } catch (e) {
            console.error(e);
        }
        // finally { setLoadingLive(false); }
    }

    async function fetchReport(viewId: string) {
        setLoadingReport(true);
        try {
            // Determine endpoint
            let endpoint = '';
            if (viewId === 'channels') endpoint = '/api/analytics/acquisition/channels';
            if (viewId === 'campaigns') endpoint = '/api/analytics/acquisition/campaigns';
            if (viewId === 'pages') endpoint = '/api/analytics/behaviour/pages';
            if (viewId === 'search') endpoint = '/api/analytics/behaviour/search';
            if (viewId === 'entry') endpoint = '/api/analytics/behaviour/entry';
            if (viewId === 'exit') endpoint = '/api/analytics/behaviour/exit';

            // Calculate dates
            const end = new Date();
            const start = new Date();
            if (dateRange === '7d') start.setDate(start.getDate() - 7);
            if (dateRange === '30d') start.setDate(start.getDate() - 30);
            if (dateRange === 'today') start.setHours(0, 0, 0, 0);
            if (dateRange === 'yesterday') {
                start.setDate(start.getDate() - 1);
                start.setHours(0, 0, 0, 0);
                end.setDate(end.getDate() - 1);
                end.setHours(23, 59, 59, 999);
            }

            const res = await fetch(`${endpoint}?startDate=${start.toISOString()}&endDate=${end.toISOString()}`, {
                headers: { Authorization: `Bearer ${token}`, 'x-account-id': currentAccount!.id }
            });

            if (res.ok) {
                setReportData(await res.json());
            }
        } catch (e) { console.error(e); }
        finally { setLoadingReport(false); }
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] -m-8 overflow-hidden">
            {/* Sidebar */}
            <div className={`w-64 bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col transition-all duration-300 ${sidebarOpen ? '' : '-ml-64'}`}>
                <div className="p-4 border-b border-slate-800 font-bold text-white flex justify-between items-center">
                    <span>Analytics</span>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden"><X size={20} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-8">
                    {MENUS.map((menu, i) => (
                        <div key={i}>
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{menu.title}</h4>
                            <div className="space-y-1">
                                {menu.items.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveView(item.id)}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeView === item.id ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
                                    >
                                        <item.icon size={18} />
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        {!sidebarOpen && <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg"><Menu size={20} className="text-gray-600" /></button>}
                        <h1 className="text-xl font-bold text-gray-900 capitalize">{activeView.replace('-', ' ')}</h1>
                    </div>

                    {/* Date Range Picker (Only for reports) */}
                    {activeView !== 'overview' && activeView !== 'realtime' && activeView !== 'url-builder' && (
                        <select
                            value={dateRange}
                            onChange={e => setDateRange(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="today">Today</option>
                            <option value="yesterday">Yesterday</option>
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                        </select>
                    )}
                </header>

                <main className="flex-1 overflow-auto p-8">
                    {activeView === 'overview' && (
                        <AnalyticsOverview
                            visitors={visitors}
                            carts={carts}
                            setActiveView={setActiveView}
                        />
                    )}
                    {activeView === 'realtime' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <VisitorsTable data={visitors} />
                        </div>
                    )}
                    {activeView === 'url-builder' && <UrlBuilder />}
                    {activeView === 'roadblocks' && <RoadblocksView dateRange={dateRange} />}

                    {/* Render Generic Report Table for others */}
                    {activeView !== 'overview' && activeView !== 'realtime' && activeView !== 'url-builder' && activeView !== 'roadblocks' && (
                        <ReportsTable
                            data={reportData}
                            loading={loadingReport}
                            activeView={activeView}
                        />
                    )}
                </main>
            </div>
        </div>
    );
}
