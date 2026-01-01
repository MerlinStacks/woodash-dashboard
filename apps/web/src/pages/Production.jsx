
import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useAccount } from '../context/AccountContext';
import { useSettings } from '../context/SettingsContext';
import { toast } from 'sonner';
import { GripVertical, Package } from 'lucide-react';

const Production = () => {
    const { activeAccount } = useAccount();
    const { settings } = useSettings();
    const [draggedOrderId, setDraggedOrderId] = useState(null);

    // 1. Fetch Orders (Processing only)
    const orders = useLiveQuery(() => {
        if (!activeAccount) return [];
        return db.orders
            .where('account_id').equals(activeAccount.id)
            .filter(o => o.status === 'processing')
            .toArray();
    }, [activeAccount?.id]) || [];

    // 2. Get Settings from Context (Syncs with Server)
    const columns = settings?.production?.columns || [
        { id: 'artwork_prep', label: 'Artwork Prep', color: '#3b82f6' },
        { id: 'engraving', label: 'Laser Engraving', color: '#eab308' },
        { id: 'packing', label: 'Packing', color: '#22c55e' }
    ];

    // 3. Group Orders
    const boardData = useMemo(() => {
        const board = {};
        columns.forEach(col => board[col.id] = []);

        orders.forEach(order => {
            // Check 'production_status'
            const status = order.production_status || columns[0]?.id; // Default to first Step
            if (status && board[status]) {
                board[status].push(order);
            } else if (columns.length > 0) {
                board[columns[0].id].push(order);
            }
        });
        return board;
    }, [orders, columns]);

    // 4. Handlers
    const onDragStart = (e, orderId) => {
        setDraggedOrderId(orderId);
        e.dataTransfer.setData('orderId', orderId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const onDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const onDrop = async (e, targetStatus) => {
        e.preventDefault();
        const orderId = e.dataTransfer.getData('orderId');
        if (!orderId) return;

        try {
            await db.orders.update(parseInt(orderId), { production_status: targetStatus });
            toast.success(`Moved to ${targetStatus}`);
        } catch (error) {
            console.error(error);
            toast.error('Failed to move order');
        }
        setDraggedOrderId(null);
    };

    return (
        <div className="p-6 h-screen flex flex-col bg-slate-950 text-slate-100">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Package className="text-blue-500" /> Production Floor
            </h1>

            <div className="flex gap-4 h-full overflow-x-auto pb-4">
                {columns.map(col => (
                    <div
                        key={col.id}
                        className="flex-shrink-0 w-80 flex flex-col bg-slate-900/50 rounded-lg border border-slate-800"
                        onDragOver={onDragOver}
                        onDrop={(e) => onDrop(e, col.id)}
                    >
                        {/* Column Header */}
                        <div className="p-3 border-b border-slate-800 flex justify-between items-center" style={{ borderTop: `4px solid ${col.color}` }}>
                            <span className="font-semibold">{col.label}</span>
                            <span className="bg-slate-800 text-xs px-2 py-1 rounded-full text-slate-400">
                                {boardData[col.id]?.length || 0}
                            </span>
                        </div>

                        {/* Drop Zone */}
                        <div className="flex-1 p-2 overflow-y-auto space-y-2 relative scrollbar-thin scrollbar-thumb-slate-700">
                            {boardData[col.id]?.map(order => (
                                <div
                                    key={order.id}
                                    draggable
                                    onDragStart={(e) => onDragStart(e, order.id)} // Pass ID as string or number? setData expects string.
                                    className="bg-slate-800 hover:bg-slate-700 p-3 rounded border border-slate-700 cursor-grab active:cursor-grabbing shadow-sm group transition-colors"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-mono text-xs text-blue-400 font-bold">#{order.id}</span>
                                        <GripVertical size={14} className="text-slate-600 group-hover:text-slate-400" />
                                    </div>
                                    <div className="font-medium text-sm truncate text-slate-200">
                                        {order.billing?.first_name} {order.billing?.last_name}
                                    </div>

                                    <div className="mt-2 text-xs text-slate-500 flex flex-col gap-1">
                                        {(order.line_items || []).slice(0, 3).map((item, idx) => (
                                            <div key={idx} className="truncate">• {item.name} x{item.quantity}</div>
                                        ))}
                                        {(order.line_items || []).length > 3 && <span>+{(order.line_items.length - 3)} more</span>}
                                    </div>

                                    {/* Order Date */}
                                    <div className="mt-3 text-[10px] text-slate-600">
                                        {new Date(order.date_created).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                            {boardData[col.id]?.length === 0 && (
                                <div className="text-center py-10 text-slate-700 text-sm italic">
                                    Empty Stage
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {columns.length === 0 && (
                    <div className="text-center text-slate-500 w-full pt-20">
                        No production stages configured. Go to Settings -> Production.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Production;
