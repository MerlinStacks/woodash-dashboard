/**
 * Store Step
 * 
 * First step in onboarding: Connect WooCommerce store with API credentials.
 * Includes connection testing functionality.
 */

import React, { useState } from 'react';
import { Store, ArrowRight, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { OnboardingStepProps } from '../types';
import { useAuth } from '../../../context/AuthContext';
import { Logger } from '../../../utils/logger';

/**
 * Handles store name, domain, and WooCommerce API credentials.
 * Provides a "Test Connection" button to verify credentials before proceeding.
 */
export function StoreStep({ draft, setDraft, onNext, isSubmitting }: OnboardingStepProps) {
    const { token } = useAuth();
    const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [testError, setTestError] = useState<string | null>(null);

    const handleChange = (field: keyof typeof draft.store, value: string | boolean) => {
        setDraft(prev => ({
            ...prev,
            store: { ...prev.store, [field]: value }
        }));
        // Reset test status when credentials change
        if (['wooUrl', 'wooConsumerKey', 'wooConsumerSecret'].includes(field as string)) {
            setTestStatus('idle');
            setTestError(null);
        }
    };

    const testConnection = async () => {
        setTestStatus('loading');
        setTestError(null);

        try {
            const res = await fetch('/api/woocommerce/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    wooUrl: draft.store.wooUrl,
                    wooConsumerKey: draft.store.wooConsumerKey,
                    wooConsumerSecret: draft.store.wooConsumerSecret
                })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setTestStatus('success');
                handleChange('connectionVerified', true);
            } else {
                setTestStatus('error');
                setTestError(data.error || 'Could not connect to WooCommerce store');
            }
        } catch (error) {
            Logger.error('WooCommerce connection test failed', { error });
            setTestStatus('error');
            setTestError('Failed to test connection. Please check the URL and try again.');
        }
    };

    const canProceed = draft.store.name.trim() &&
        draft.store.wooUrl.trim() &&
        draft.store.wooConsumerKey.trim() &&
        draft.store.wooConsumerSecret.trim();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center pb-4 border-b border-gray-100">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 mb-4">
                    <Store size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Connect Your Store</h2>
                <p className="text-gray-500 mt-2">
                    Enter your WooCommerce store details and API credentials
                </p>
            </div>

            {/* Form Fields */}
            <div className="space-y-5">
                {/* Store Name & Domain Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Store Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={draft.store.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="My Awesome Store"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Domain URL <span className="text-gray-400">(optional)</span>
                        </label>
                        <input
                            type="url"
                            value={draft.store.domain}
                            onChange={(e) => handleChange('domain', e.target.value)}
                            placeholder="https://mystore.com"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                        />
                    </div>
                </div>

                {/* WooCommerce Credentials */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">WooCommerce API Credentials</h3>
                    <p className="text-xs text-gray-500 mb-4">
                        Find these in WooCommerce → Settings → Advanced → REST API. Create a key with <strong>Read/Write</strong> permissions.
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Store URL <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="url"
                                value={draft.store.wooUrl}
                                onChange={(e) => handleChange('wooUrl', e.target.value)}
                                placeholder="https://mystore.com"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Consumer Key <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={draft.store.wooConsumerKey}
                                onChange={(e) => handleChange('wooConsumerKey', e.target.value)}
                                placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxx"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors font-mono text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Consumer Secret <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                value={draft.store.wooConsumerSecret}
                                onChange={(e) => handleChange('wooConsumerSecret', e.target.value)}
                                placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxx"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors font-mono text-sm"
                            />
                        </div>
                    </div>

                    {/* Test Connection Button */}
                    <div className="mt-4 pt-4 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={testConnection}
                            disabled={!canProceed || testStatus === 'loading'}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                        >
                            {testStatus === 'loading' ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : testStatus === 'success' ? (
                                <CheckCircle size={16} className="text-green-400" />
                            ) : (
                                <Store size={16} />
                            )}
                            {testStatus === 'loading' ? 'Testing...' :
                                testStatus === 'success' ? 'Connection Verified' :
                                    'Test Connection'}
                        </button>

                        {testStatus === 'success' && (
                            <p className="mt-2 text-sm text-green-600 flex items-center gap-1.5">
                                <CheckCircle size={14} />
                                Successfully connected to your WooCommerce store!
                            </p>
                        )}

                        {testStatus === 'error' && testError && (
                            <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
                                <AlertCircle size={14} />
                                {testError}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-end pt-4 border-t border-gray-100">
                <button
                    type="button"
                    onClick={onNext}
                    disabled={!canProceed || isSubmitting}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold shadow-lg shadow-blue-500/25"
                >
                    Continue
                    <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );
}
