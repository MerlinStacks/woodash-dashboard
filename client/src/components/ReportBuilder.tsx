
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAccount } from '../context/AccountContext';
import { Download, Table, BarChart3, Filter } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getDateRange } from '../utils/dateUtils';
// import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'; // We can add viz later

interface ReportResult {
    dimension: string;
    sales?: number;
    orders?: number;
    aov?: number;
    quantity?: number;
}

export function ReportBuilder() {
    const { token } = useAuth();
    const { currentAccount } = useAccount();

    const [metrics, setMetrics] = useState<string[]>(['sales']);
    const [dimension, setDimension] = useState('day');
    const [dateRange, setDateRange] = useState('30d');
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<ReportResult[]>([]);

    const toggleMetric = (m: string) => {
        if (metrics.includes(m)) {
            setMetrics(metrics.filter(x => x !== m));
        } else {
            setMetrics([...metrics, m]);
        }
    };

    const generateReport = async () => {
        if (!currentAccount || !token) return;
        setIsLoading(true);

        const range = getDateRange(dateRange);

        try {
            const res = await fetch('/api/analytics/custom-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Account-ID': currentAccount.id
                },
                body: JSON.stringify({
                    metrics,
                    dimension,
                    startDate: range.startDate,
                    endDate: range.endDate
                })
            });

            if (res.ok) {
                const data = await res.json();
                setResults(data);
            }
        } catch (error) {
            console.error('Report failed', error);
        } finally {
            setIsLoading(false);
        }
    };

    const exportCSV = () => {
        if (results.length === 0) return;
        const headers = ['Dimension', ...metrics];
        const rows = results.map(row => [
            row.dimension,
            ...metrics.map(m => (row as any)[m] || 0)
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `custom_report_${new Date().toISOString()}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    const exportPDF = () => {
        if (results.length === 0) return;
        const doc = new jsPDF();

        doc.text("Custom Report", 14, 15);

        const tableColumn = ["Dimension", ...metrics.map(m => m.toUpperCase())];
        const tableRows = results.map(row => [
            row.dimension,
            ...metrics.map(m => {
                const val = (row as any)[m] || 0;
                return typeof val === 'number' ? val.toFixed(2) : val;
            })
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 20,
        });

        doc.save(`custom_report_${new Date().toISOString()}.pdf`);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
            <div className="flex flex-col md:flex-row gap-6">

                {/* Configuration Panel */}
                <div className="w-full md:w-1/3 space-y-4 border-r pr-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Filter size={20} /> Report Configuration
                    </h3>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="w-full border rounded-lg p-2"
                        >
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="90d">Last 90 Days</option>
                            <option value="ytd">Year to Date</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Group By (Dimension)</label>
                        <select
                            value={dimension}
                            onChange={(e) => setDimension(e.target.value)}
                            className="w-full border rounded-lg p-2"
                        >
                            <option value="day">Day</option>
                            <option value="month">Month</option>
                            <option value="product">Product</option>
                            <option value="category">Product Category</option>
                            <option value="customer">Customer</option>
                            <option value="customer_segment">Customer Segment (Beta)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Metrics</label>
                        <div className="space-y-2">
                            {['sales', 'orders', 'aov', 'quantity'].map(m => (
                                <label key={m} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={metrics.includes(m)}
                                        onChange={() => toggleMetric(m)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="capitalize">{m}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={generateReport}
                        disabled={isLoading || metrics.length === 0}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        {isLoading ? 'Generating...' : 'Generate Report'}
                    </button>

                </div>

                {/* Results Panel */}
                <div className="flex-1 min-h-[400px]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Results</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={exportCSV}
                                disabled={results.length === 0}
                                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 border px-3 py-1 rounded disabled:opacity-50"
                            >
                                <Download size={16} /> CSV
                            </button>
                            <button
                                onClick={exportPDF}
                                disabled={results.length === 0}
                                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 border px-3 py-1 rounded disabled:opacity-50"
                            >
                                <Download size={16} /> PDF
                            </button>
                        </div>
                    </div>

                    {results.length === 0 ? (
                        <div className="h-64 flex items-center justify-center text-gray-400 border border-dashed rounded-lg">
                            Configure and generate a report to see results
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {dimension === 'product' ? 'Product Name' : 'Date'}
                                        </th>
                                        {metrics.map(m => (
                                            <th key={m} className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {m}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {results.map((row, i) => (
                                        <tr key={i}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {row.dimension}
                                            </td>
                                            {metrics.map(m => (
                                                <td key={m} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                                    {m === 'sales' || m === 'aov'
                                                        ? `$${((row as any)[m] || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                                                        : ((row as any)[m] || 0)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Add types for jspdf-autotable to allow string indexing if needed, usually auto-detected
