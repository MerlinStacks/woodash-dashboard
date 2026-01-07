import { prisma } from '../../utils/prisma';
import { Logger } from '../../utils/logger';
import { AdsService } from '../ads';

/**
 * AI Tools for advertising platform analytics.
 * Provides insights into Meta and Google Ads performance.
 */
export class AdsTools {

    /**
     * Get ad performance metrics for the account.
     * Aggregates data from all connected ad accounts or a specific platform.
     */
    static async getAdPerformance(accountId: string, platform?: string) {
        try {
            const whereClause: any = { accountId };
            if (platform) {
                whereClause.platform = platform.toUpperCase();
            }

            const adAccounts = await prisma.adAccount.findMany({
                where: whereClause,
                select: {
                    id: true,
                    platform: true,
                    name: true,
                    externalId: true
                }
            });

            if (adAccounts.length === 0) {
                return "No ad accounts connected. Connect your Meta or Google Ads account in Settings > Integrations.";
            }

            const results: any[] = [];

            for (const adAccount of adAccounts) {
                try {
                    let insights = null;

                    if (adAccount.platform === 'META') {
                        insights = await AdsService.getMetaInsights(adAccount.id);
                    } else if (adAccount.platform === 'GOOGLE') {
                        insights = await AdsService.getGoogleInsights(adAccount.id);
                    }

                    if (insights) {
                        results.push({
                            platform: adAccount.platform,
                            account_name: adAccount.name || `${adAccount.platform} Account`,
                            spend: `${insights.currency} ${insights.spend.toFixed(2)}`,
                            impressions: insights.impressions.toLocaleString(),
                            clicks: insights.clicks.toLocaleString(),
                            ctr: insights.impressions > 0
                                ? `${((insights.clicks / insights.impressions) * 100).toFixed(2)}%`
                                : '0%',
                            roas: `${insights.roas.toFixed(2)}x`,
                            period: `${insights.date_start} to ${insights.date_stop}`
                        });
                    }
                } catch (err) {
                    Logger.warn(`Failed to fetch insights for ad account ${adAccount.id}`, { error: err });
                    results.push({
                        platform: adAccount.platform,
                        account_name: adAccount.name || `${adAccount.platform} Account`,
                        error: "Unable to fetch data - check credentials"
                    });
                }
            }

            if (results.length === 0) {
                return "Could not retrieve ad performance data. Please check your ad account connections.";
            }

            return results;

        } catch (error) {
            Logger.error('Tool Error (getAdPerformance)', { error });
            return "Failed to retrieve ad performance data.";
        }
    }

    /**
     * Compare performance across Meta and Google Ads platforms.
     * Useful for understanding which platform performs better.
     */
    static async compareAdPlatforms(accountId: string) {
        try {
            const adAccounts = await prisma.adAccount.findMany({
                where: { accountId },
                select: {
                    id: true,
                    platform: true,
                    name: true
                }
            });

            if (adAccounts.length === 0) {
                return "No ad accounts connected. Connect your Meta or Google Ads account in Settings > Integrations.";
            }

            const metaAccounts = adAccounts.filter(a => a.platform === 'META');
            const googleAccounts = adAccounts.filter(a => a.platform === 'GOOGLE');

            const comparison: any = {
                meta: null,
                google: null,
                recommendation: null
            };

            // Aggregate Meta metrics
            if (metaAccounts.length > 0) {
                let totalSpend = 0, totalClicks = 0, totalImpressions = 0, totalRoas = 0;
                let successCount = 0;

                for (const acc of metaAccounts) {
                    try {
                        const insights = await AdsService.getMetaInsights(acc.id);
                        if (insights) {
                            totalSpend += insights.spend;
                            totalClicks += insights.clicks;
                            totalImpressions += insights.impressions;
                            totalRoas += insights.roas;
                            successCount++;
                        }
                    } catch { /* skip */ }
                }

                if (successCount > 0) {
                    comparison.meta = {
                        platform: 'Meta (Facebook/Instagram)',
                        accounts_count: metaAccounts.length,
                        total_spend: totalSpend.toFixed(2),
                        total_clicks: totalClicks,
                        total_impressions: totalImpressions,
                        avg_ctr: totalImpressions > 0
                            ? `${((totalClicks / totalImpressions) * 100).toFixed(2)}%`
                            : '0%',
                        avg_roas: `${(totalRoas / successCount).toFixed(2)}x`
                    };
                }
            }

            // Aggregate Google metrics
            if (googleAccounts.length > 0) {
                let totalSpend = 0, totalClicks = 0, totalImpressions = 0, totalRoas = 0;
                let successCount = 0;

                for (const acc of googleAccounts) {
                    try {
                        const insights = await AdsService.getGoogleInsights(acc.id);
                        if (insights) {
                            totalSpend += insights.spend;
                            totalClicks += insights.clicks;
                            totalImpressions += insights.impressions;
                            totalRoas += insights.roas;
                            successCount++;
                        }
                    } catch { /* skip */ }
                }

                if (successCount > 0) {
                    comparison.google = {
                        platform: 'Google Ads',
                        accounts_count: googleAccounts.length,
                        total_spend: totalSpend.toFixed(2),
                        total_clicks: totalClicks,
                        total_impressions: totalImpressions,
                        avg_ctr: totalImpressions > 0
                            ? `${((totalClicks / totalImpressions) * 100).toFixed(2)}%`
                            : '0%',
                        avg_roas: `${(totalRoas / successCount).toFixed(2)}x`
                    };
                }
            }

            // Generate recommendation
            if (comparison.meta && comparison.google) {
                const metaRoas = parseFloat(comparison.meta.avg_roas);
                const googleRoas = parseFloat(comparison.google.avg_roas);

                if (metaRoas > googleRoas) {
                    comparison.recommendation = `Meta Ads is performing better with ${comparison.meta.avg_roas} ROAS vs Google's ${comparison.google.avg_roas}`;
                } else if (googleRoas > metaRoas) {
                    comparison.recommendation = `Google Ads is performing better with ${comparison.google.avg_roas} ROAS vs Meta's ${comparison.meta.avg_roas}`;
                } else {
                    comparison.recommendation = "Both platforms are performing similarly.";
                }
            } else if (!comparison.meta && !comparison.google) {
                return "Could not retrieve data from any ad platform. Please check your connections.";
            }

            return comparison;

        } catch (error) {
            Logger.error('Tool Error (compareAdPlatforms)', { error });
            return "Failed to compare ad platforms.";
        }
    }

    /**
     * Analyze Google Ads campaigns with detailed performance breakdown.
     * Returns campaign-level metrics and identifies opportunities.
     */
    static async analyzeGoogleAdsCampaigns(accountId: string, days: number = 30) {
        try {
            const adAccounts = await prisma.adAccount.findMany({
                where: { accountId, platform: 'GOOGLE' },
                select: { id: true, name: true, externalId: true }
            });

            if (adAccounts.length === 0) {
                return "No Google Ads accounts connected. Connect your Google Ads account in Marketing > Ad Accounts.";
            }

            const allCampaigns: any[] = [];

            for (const adAccount of adAccounts) {
                try {
                    const campaigns = await AdsService.getGoogleCampaignInsights(adAccount.id, days);
                    campaigns.forEach(c => {
                        allCampaigns.push({
                            account: adAccount.name || adAccount.externalId,
                            ...c
                        });
                    });
                } catch (err) {
                    Logger.warn(`Failed to fetch campaigns for ${adAccount.id}`, { error: err });
                }
            }

            if (allCampaigns.length === 0) {
                return "No campaign data available. Please check your Google Ads connection.";
            }

            // Calculate totals
            const totals = allCampaigns.reduce((acc, c) => ({
                spend: acc.spend + c.spend,
                clicks: acc.clicks + c.clicks,
                impressions: acc.impressions + c.impressions,
                conversions: acc.conversions + c.conversions,
                conversionsValue: acc.conversionsValue + c.conversionsValue
            }), { spend: 0, clicks: 0, impressions: 0, conversions: 0, conversionsValue: 0 });

            // Sort by various metrics to find top/bottom performers
            const bySpend = [...allCampaigns].sort((a, b) => b.spend - a.spend);
            const byRoas = [...allCampaigns].filter(c => c.spend > 0).sort((a, b) => b.roas - a.roas);
            const byConversions = [...allCampaigns].sort((a, b) => b.conversions - a.conversions);

            // Identify underperformers (high spend, low ROAS)
            const underperformers = allCampaigns
                .filter(c => c.spend > totals.spend * 0.05 && c.roas < 1)
                .sort((a, b) => b.spend - a.spend)
                .slice(0, 3);

            // Identify high performers
            const highPerformers = allCampaigns
                .filter(c => c.roas >= 3)
                .sort((a, b) => b.conversionsValue - a.conversionsValue)
                .slice(0, 3);

            return {
                summary: {
                    total_campaigns: allCampaigns.length,
                    total_spend: `$${totals.spend.toFixed(2)}`,
                    total_clicks: totals.clicks,
                    total_impressions: totals.impressions,
                    total_conversions: totals.conversions.toFixed(0),
                    overall_roas: totals.spend > 0 ? `${(totals.conversionsValue / totals.spend).toFixed(2)}x` : 'N/A',
                    overall_ctr: totals.impressions > 0 ? `${((totals.clicks / totals.impressions) * 100).toFixed(2)}%` : 'N/A',
                    period: `Last ${days} days`
                },
                top_spenders: bySpend.slice(0, 5).map(c => ({
                    campaign: c.campaignName,
                    spend: `$${c.spend.toFixed(2)}`,
                    roas: `${c.roas.toFixed(2)}x`,
                    status: c.status
                })),
                highest_roas: byRoas.slice(0, 5).map(c => ({
                    campaign: c.campaignName,
                    roas: `${c.roas.toFixed(2)}x`,
                    spend: `$${c.spend.toFixed(2)}`,
                    conversions: c.conversions.toFixed(0)
                })),
                underperformers: underperformers.map(c => ({
                    campaign: c.campaignName,
                    spend: `$${c.spend.toFixed(2)}`,
                    roas: `${c.roas.toFixed(2)}x`,
                    issue: c.roas < 0.5 ? 'Very low ROAS - consider pausing' : 'Below breakeven - needs optimization'
                })),
                high_performers: highPerformers.map(c => ({
                    campaign: c.campaignName,
                    roas: `${c.roas.toFixed(2)}x`,
                    revenue: `$${c.conversionsValue.toFixed(2)}`,
                    suggestion: 'Consider increasing budget'
                }))
            };

        } catch (error) {
            Logger.error('Tool Error (analyzeGoogleAdsCampaigns)', { error });
            return "Failed to analyze Google Ads campaigns.";
        }
    }

    /**
     * Get AI-powered optimization suggestions for Google Ads campaigns.
     * Analyzes campaign data and provides actionable recommendations.
     */
    static async getAdOptimizationSuggestions(accountId: string) {
        try {
            const analysis = await this.analyzeGoogleAdsCampaigns(accountId, 30);

            if (typeof analysis === 'string') {
                return analysis; // Error message
            }

            const suggestions: string[] = [];

            // Budget reallocation suggestions
            if (analysis.underperformers && analysis.underperformers.length > 0) {
                suggestions.push(
                    `🔴 **Underperforming Campaigns**: ${analysis.underperformers.length} campaign(s) have ROAS below 1x. ` +
                    `Consider pausing or reducing budget for: ${analysis.underperformers.map((c: any) => c.campaign).join(', ')}.`
                );
            }

            if (analysis.high_performers && analysis.high_performers.length > 0) {
                suggestions.push(
                    `🟢 **High Performers**: ${analysis.high_performers.length} campaign(s) have ROAS above 3x. ` +
                    `Consider increasing budget for: ${analysis.high_performers.map((c: any) => c.campaign).join(', ')}.`
                );
            }

            // CTR suggestions
            const overallCtr = parseFloat(analysis.summary.overall_ctr) || 0;
            if (overallCtr < 1) {
                suggestions.push(
                    `📊 **Low Overall CTR** (${analysis.summary.overall_ctr}): Your ads aren't getting clicks. ` +
                    `Consider testing new ad copy, headlines, or targeting options to improve click-through rates.`
                );
            } else if (overallCtr < 2) {
                suggestions.push(
                    `📊 **Average CTR** (${analysis.summary.overall_ctr}): There's room for improvement. ` +
                    `A/B test your ad creatives and try more compelling calls-to-action.`
                );
            }

            // ROAS suggestions
            const overallRoas = parseFloat(analysis.summary.overall_roas) || 0;
            if (overallRoas < 2) {
                suggestions.push(
                    `💰 **Low Overall ROAS** (${analysis.summary.overall_roas}): Your return on ad spend is below optimal. ` +
                    `Focus on high-intent keywords, improve landing pages, and review your conversion tracking setup.`
                );
            } else if (overallRoas >= 4) {
                suggestions.push(
                    `🚀 **Excellent ROAS** (${analysis.summary.overall_roas}): Your campaigns are highly profitable. ` +
                    `Consider scaling up your best performers and testing similar audiences or keywords.`
                );
            }

            // Campaign count suggestions
            if (analysis.summary.total_campaigns > 10) {
                suggestions.push(
                    `📁 **Many Active Campaigns** (${analysis.summary.total_campaigns}): Consider consolidating campaigns ` +
                    `with similar objectives to simplify management and improve learning for Google's algorithm.`
                );
            }

            if (suggestions.length === 0) {
                suggestions.push(
                    `✅ **Overall Performance**: Your Google Ads campaigns appear to be performing well. ` +
                    `Continue monitoring and make incremental optimizations as data accumulates.`
                );
            }

            return {
                suggestions,
                summary: analysis.summary,
                action_items: suggestions.length > 1
                    ? suggestions.slice(0, 3).map((s, i) => `${i + 1}. ${s.split(':')[0].replace(/[🔴🟢📊💰🚀📁✅]/g, '').trim()}`)
                    : ['Monitor campaign performance', 'Review conversion tracking', 'Test new ad variations']
            };

        } catch (error) {
            Logger.error('Tool Error (getAdOptimizationSuggestions)', { error });
            return "Failed to generate optimization suggestions.";
        }
    }
}
