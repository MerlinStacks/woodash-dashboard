import { X, ExternalLink, Package, User, CreditCard } from 'lucide-react';
import { formatDate } from '../../utils/format';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAccount } from '../../context/AccountContext';

interface OrderPreviewModalProps {
    orderId: number | null;
    isOpen: boolean;
    onClose: () => void;
}

export function OrderPreviewModal({ orderId, isOpen, onClose }: OrderPreviewModalProps) {
    const navigate = useNavigate();
    const { token } = useAuth();
    const { currentAccount } = useAccount();
    const [order, setOrder] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && orderId && currentAccount && token) {
            fetchOrderDetails();
        } else {
            setOrder(null);
        }
    }, [isOpen, orderId, currentAccount, token]);

    async function fetchOrderDetails() {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Account-ID': currentAccount?.id || ''
                }
            });
            if (res.ok) {
                const data = await res.json();
                setOrder(data);
            }
        } catch (error) {
            console.error('Failed to load order', error);
        } finally {
            setIsLoading(false);
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Order #{orderId}</h2>
                        <p className="text-sm text-gray-500">Quick Preview</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-6">
                    {isLoading ? (
                        <div className="py-10 text-center text-gray-400">Loading details...</div>
                    ) : order ? (
                        <>
                            {/* Status Badge */}
                            <div className="flex items-center justify-between">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide
                                    ${order.status === 'completed' ? 'bg-green-100 text-green-700' :
                                        order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                                            'bg-gray-100 text-gray-700'}`}>
                                    {order.status}
                                </span>
                                <span className="text-sm text-gray-500">{formatDate(order.date_created)}</span>
                            </div>

                            {/* Customer Summary */}
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                                <div className="flex items-center gap-3 text-gray-700 font-medium border-b border-gray-200 pb-2">
                                    <User size={16} className="text-gray-400" />
                                    {order.billing?.first_name} {order.billing?.last_name}
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <div className="text-gray-400 text-xs uppercase mb-1">Email</div>
                                        <div className="text-gray-800 truncate">{order.billing?.email}</div>
                                    </div>
                                    {/* Items Breakdown */}
                                    <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                                        <div className="px-4 py-2 bg-gray-100/50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                                            Items ({order.line_items?.length || 0})
                                        </div>
                                        <div className="divide-y divide-gray-100">
                                            {order.line_items?.map((item: any) => (
                                                <div key={item.id} className="p-3 flex justify-between items-center text-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-white border border-gray-200 p-1.5 rounded-md text-gray-400">
                                                            <Package size={14} />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-900">{item.name}</div>
                                                            <div className="text-xs text-gray-500">Qty: {item.quantity} × {new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency }).format(item.price)}</div>
                                                        </div>
                                                    </div>
                                                    <div className="font-medium text-gray-900">
                                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency }).format(item.total)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Totals */}
                                <div className="flex items-center justify-end gap-2 text-xl font-bold text-gray-900">
                                    <span className="text-sm font-normal text-gray-500 uppercase tracking-wide mr-2">Total</span>
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency || 'USD' }).format(Number(order.total))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center text-red-500 py-4">Failed to load order data.</div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors">
                        Close
                    </button>
                    <button
                        onClick={() => navigate(`/orders/${orderId}`)}
                        className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm shadow-blue-200 transition-all hover:shadow-md"
                    >
                        View Full Details
                        <ExternalLink size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
