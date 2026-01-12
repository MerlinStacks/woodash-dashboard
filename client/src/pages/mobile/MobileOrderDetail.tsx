import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Package,
    Truck,
    CheckCircle,
    XCircle,
    Clock,
    MapPin,
    User,
    Mail,
    Phone,
    CreditCard,
    Copy,
    ExternalLink
} from 'lucide-react';
import api from '../../services/api';

/**
 * MobileOrderDetail - Order detail view optimized for mobile.
 * 
 * Features:
 * - Order summary
 * - Status timeline
 * - Customer info
 * - Line items
 * - Quick actions
 */

interface OrderDetail {
    id: string;
    orderNumber: string;
    status: string;
    createdAt: string;
    total: number;
    subtotal: number;
    shippingTotal: number;
    taxTotal: number;
    paymentMethod: string;
    customer: {
        name: string;
        email: string;
        phone?: string;
    };
    billing: {
        address1: string;
        city: string;
        state: string;
        postcode: string;
        country: string;
    };
    shipping: {
        address1: string;
        city: string;
        state: string;
        postcode: string;
        country: string;
    };
    lineItems: {
        id: string;
        name: string;
        quantity: number;
        price: number;
        image?: string;
    }[];
    trackingNumber?: string;
    trackingUrl?: string;
}

const STATUS_CONFIG: Record<string, { icon: typeof Package; color: string; bg: string; text: string }> = {
    pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100', text: 'Pending' },
    processing: { icon: Package, color: 'text-blue-600', bg: 'bg-blue-100', text: 'Processing' },
    shipped: { icon: Truck, color: 'text-purple-600', bg: 'bg-purple-100', text: 'Shipped' },
    delivered: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', text: 'Delivered' },
    completed: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', text: 'Completed' },
    cancelled: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', text: 'Cancelled' },
};

export function MobileOrderDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/orders/${id}`);
            const o = response.data;

            setOrder({
                id: o.id,
                orderNumber: o.orderNumber || `#${o.id.slice(-6).toUpperCase()}`,
                status: o.status || 'pending',
                createdAt: o.createdAt,
                total: o.total || 0,
                subtotal: o.subtotal || 0,
                shippingTotal: o.shippingTotal || 0,
                taxTotal: o.taxTotal || 0,
                paymentMethod: o.paymentMethod || 'Unknown',
                customer: {
                    name: o.billing?.firstName
                        ? `${o.billing.firstName} ${o.billing.lastName || ''}`.trim()
                        : 'Guest',
                    email: o.billing?.email || o.customerEmail || '',
                    phone: o.billing?.phone
                },
                billing: {
                    address1: o.billing?.address1 || '',
                    city: o.billing?.city || '',
                    state: o.billing?.state || '',
                    postcode: o.billing?.postcode || '',
                    country: o.billing?.country || ''
                },
                shipping: {
                    address1: o.shipping?.address1 || o.billing?.address1 || '',
                    city: o.shipping?.city || o.billing?.city || '',
                    state: o.shipping?.state || o.billing?.state || '',
                    postcode: o.shipping?.postcode || o.billing?.postcode || '',
                    country: o.shipping?.country || o.billing?.country || ''
                },
                lineItems: (o.lineItems || []).map((item: any) => ({
                    id: item.id,
                    name: item.name || 'Unknown Product',
                    quantity: item.quantity || 1,
                    price: item.total || item.price || 0,
                    image: item.image?.src
                })),
                trackingNumber: o.trackingNumber,
                trackingUrl: o.trackingUrl
            });
        } catch (error) {
            console.error('[MobileOrderDetail] Error fetching order:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency: 'AUD'
        }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-AU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        if ('vibrate' in navigator) navigator.vibrate(10);
    };

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-10 bg-gray-200 rounded w-1/3" />
                <div className="h-24 bg-gray-200 rounded-xl" />
                <div className="h-40 bg-gray-200 rounded-xl" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="text-center py-12">
                <Package className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-500">Order not found</p>
                <button
                    onClick={() => navigate('/m/orders')}
                    className="mt-4 text-indigo-600 font-medium"
                >
                    Back to Orders
                </button>
            </div>
        );
    }

    const statusConfig = STATUS_CONFIG[order.status.toLowerCase()] || STATUS_CONFIG.pending;
    const StatusIcon = statusConfig.icon;

    return (
        <div className="space-y-4 pb-8">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate('/m/orders')}
                    className="p-2 -ml-2 rounded-lg active:bg-gray-100"
                >
                    <ArrowLeft size={24} className="text-gray-700" />
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-gray-900">{order.orderNumber}</h1>
                    <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                </div>
            </div>

            {/* Status Card */}
            <div className={`${statusConfig.bg} rounded-xl p-4 flex items-center gap-4`}>
                <div className="p-3 bg-white rounded-lg shadow-sm">
                    <StatusIcon size={24} className={statusConfig.color} />
                </div>
                <div className="flex-1">
                    <p className={`font-semibold ${statusConfig.color}`}>{statusConfig.text}</p>
                    {order.trackingNumber && (
                        <button
                            onClick={() => copyToClipboard(order.trackingNumber!)}
                            className="flex items-center gap-1 text-sm text-gray-600 mt-1"
                        >
                            <span>Tracking: {order.trackingNumber}</span>
                            <Copy size={14} />
                        </button>
                    )}
                </div>
                {order.trackingUrl && (
                    <a
                        href={order.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-white rounded-lg shadow-sm"
                    >
                        <ExternalLink size={20} className="text-gray-600" />
                    </a>
                )}
            </div>

            {/* Customer Info */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h2 className="font-semibold text-gray-900 mb-3">Customer</h2>
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <User size={18} className="text-gray-400" />
                        <span className="text-gray-700">{order.customer.name}</span>
                    </div>
                    {order.customer.email && (
                        <a href={`mailto:${order.customer.email}`} className="flex items-center gap-3">
                            <Mail size={18} className="text-gray-400" />
                            <span className="text-indigo-600">{order.customer.email}</span>
                        </a>
                    )}
                    {order.customer.phone && (
                        <a href={`tel:${order.customer.phone}`} className="flex items-center gap-3">
                            <Phone size={18} className="text-gray-400" />
                            <span className="text-indigo-600">{order.customer.phone}</span>
                        </a>
                    )}
                </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h2 className="font-semibold text-gray-900 mb-3">Shipping Address</h2>
                <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-gray-400 mt-0.5" />
                    <div className="text-gray-700">
                        <p>{order.shipping.address1}</p>
                        <p>{order.shipping.city}, {order.shipping.state} {order.shipping.postcode}</p>
                        <p>{order.shipping.country}</p>
                    </div>
                </div>
            </div>

            {/* Line Items */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <h2 className="font-semibold text-gray-900 p-4 border-b border-gray-100">
                    Items ({order.lineItems.length})
                </h2>
                <div className="divide-y divide-gray-100">
                    {order.lineItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-4">
                            {item.image ? (
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                                />
                            ) : (
                                <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                    <Package size={20} className="text-gray-400" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">{item.name}</p>
                                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                            </div>
                            <span className="font-medium text-gray-900">
                                {formatCurrency(item.price)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h2 className="font-semibold text-gray-900 mb-3">Order Summary</h2>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="text-gray-900">{formatCurrency(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Shipping</span>
                        <span className="text-gray-900">{formatCurrency(order.shippingTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Tax</span>
                        <span className="text-gray-900">{formatCurrency(order.taxTotal)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-100">
                        <span className="font-semibold text-gray-900">Total</span>
                        <span className="font-bold text-gray-900">{formatCurrency(order.total)}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    <CreditCard size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-600">{order.paymentMethod}</span>
                </div>
            </div>
        </div>
    );
}
