/**
 * StartingPointCard - Initial canvas placeholder for empty flows.
 * Shows a dashed-border card with "Select an Event" prompt.
 */
import React from 'react';
import { MousePointer2 } from 'lucide-react';

interface StartingPointCardProps {
    onClick: () => void;
}

export const StartingPointCard: React.FC<StartingPointCardProps> = ({ onClick }) => {
    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <button
                onClick={onClick}
                className="pointer-events-auto flex items-center gap-3 px-6 py-4 bg-white border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200 group cursor-pointer"
            >
                <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-blue-100 transition-colors">
                    <MousePointer2 size={20} className="text-gray-500 group-hover:text-blue-600" />
                </div>
                <span className="text-gray-700 font-medium group-hover:text-blue-700">
                    Select an Event
                </span>
            </button>
        </div>
    );
};
