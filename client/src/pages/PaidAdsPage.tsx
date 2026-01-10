import { AdPerformanceView } from '../components/marketing/AdPerformanceView';

export function PaidAdsPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-gray-900">Paid Ads</h1>
                <p className="text-gray-500">Monitor performance across your connected ad platforms.</p>
            </div>

            <AdPerformanceView />
        </div>
    );
}
