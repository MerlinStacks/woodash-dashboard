import React, { useEffect, useState, useCallback } from 'react';
import { ShoppingCart, Clock, User as UserIcon, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useAccount } from '../../context/AccountContext';
import { WidgetProps } from './WidgetRegistry';

interface CartSession {
    id: string;
    visitorId: string;
    email?: string;
    cartValue: number;
    cartItems: any[];
    currency: string;
    lastActiveAt: string;
    country?: string;
    city?: string;
}

const LiveCartsWidget: React.FC<WidgetProps> = ({ className }) => {
    const { token } = useAuth();
    const { currentAccount } = useAccount();
    const [carts, setCarts] = useState<CartSession[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCarts = useCallback(async () => {
        if (!currentAccount || !token) return;

        try {
            const res = await fetch('/api/tracking/carts', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Account-ID': currentAccount.id
                }
            });
            if (res.ok) {
                const data = await res.json();
                setCarts(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [currentAccount, token]);

    useEffect(() => {
        fetchCarts();
        const interval = setInterval(fetchCarts, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, [fetchCarts]);

    if (loading && carts.length === 0) {
        return (
            <div className={`bg-white h-full w-full p-4 flex flex-col rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-900">Live Carts</h3>
                    <ShoppingCart size={18} className="text-gray-400" />
                </div>
                <div className="flex-1 flex justify-center items-center">
                    <Loader2 className="animate-spin text-gray-400" />
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white h-full w-full p-4 flex flex-col rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Live Carts</h3>
                <ShoppingCart size={18} className="text-gray-400" />
            </div>
            <div className="flex-1 overflow-y-auto">
                {carts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <ShoppingCart className="w-8 h-8 mb-2 opacity-50" />
                        <span className="text-xs">No active carts</span>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {carts.map(cart => (
                            <div key={cart.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-blue-50 p-2 rounded-full">
                                        <ShoppingCart className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: cart.currency || 'USD' }).format(cart.cartValue)}
                                        </div>
                                        <div className="text-xs text-gray-500 flex items-center gap-1">
                                            <UserIcon className="w-3 h-3" />
                                            {cart.email || `Visitor ${cart.visitorId?.slice(0, 6) || 'Unknown'}...`}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-gray-400 flex items-center justify-end gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatDistanceToNow(new Date(cart.lastActiveAt), { addSuffix: true })}
                                    </div>
                                    {(cart.city || cart.country) && (
                                        <div className="text-[10px] text-gray-500 uppercase mt-0.5">
                                            {cart.city}{cart.city && cart.country ? ', ' : ''}{cart.country}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveCartsWidget;
