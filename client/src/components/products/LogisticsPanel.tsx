import React from 'react';
import { Box } from 'lucide-react';

interface LogisticsPanelProps {
    formData: {
        binLocation: string;
    };
    onChange: (data: Partial<LogisticsPanelProps['formData']>) => void;
}

export const LogisticsPanel: React.FC<LogisticsPanelProps> = ({ formData, onChange }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-semibold text-gray-900">Warehouse & Logistics</h3>
            </div>
            <div className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bin Location</label>
                    <div className="relative">
                        <Box className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            value={formData.binLocation}
                            onChange={(e) => onChange({ binLocation: e.target.value })}
                            placeholder="e.g. A-12-Shelf-3"
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Internal warehouse location for pickers.</p>
                </div>
            </div>
        </div>
    );
};
