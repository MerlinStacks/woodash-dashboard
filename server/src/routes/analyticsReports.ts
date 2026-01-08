/**
 * Analytics Reports Routes
 * 
 * Template and schedule management for scheduled reports.
 */

import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../types/express';
import { prisma } from '../utils/prisma';

const router = Router();

// System Templates Config - Organized by Category
const SYSTEM_TEMPLATES = [
    // Sales Reports
    { id: 'sys_overview', name: 'Sales Overview', type: 'SYSTEM', category: 'Sales', config: { dimension: 'day', metrics: ['sales', 'orders', 'aov'], dateRange: '30d' } },
    { id: 'sys_products', name: 'Product Performance', type: 'SYSTEM', category: 'Sales', config: { dimension: 'product', metrics: ['quantity', 'sales', 'orders'], dateRange: '30d' } },
    { id: 'sys_top_sellers', name: 'Top Sellers (90d)', type: 'SYSTEM', category: 'Sales', config: { dimension: 'product', metrics: ['sales', 'quantity'], dateRange: '90d' } },
    { id: 'sys_order_status', name: 'Order Status Breakdown', type: 'SYSTEM', category: 'Sales', config: { dimension: 'order_status', metrics: ['orders', 'sales'], dateRange: '30d' } },
    { id: 'sys_category_performance', name: 'Category Performance', type: 'SYSTEM', category: 'Sales', config: { dimension: 'category', metrics: ['sales', 'orders', 'quantity'], dateRange: '30d' } },

    // Traffic Reports  
    { id: 'sys_traffic_sources', name: 'Traffic Sources', type: 'SYSTEM', category: 'Traffic', config: { dimension: 'traffic_source', metrics: ['sessions', 'visitors', 'conversion_rate'], dateRange: '30d' } },
    { id: 'sys_campaigns', name: 'Campaign Performance', type: 'SYSTEM', category: 'Traffic', config: { dimension: 'utm_source', metrics: ['sessions', 'sales', 'conversion_rate'], dateRange: '30d' } },
    { id: 'sys_devices', name: 'Device Performance', type: 'SYSTEM', category: 'Traffic', config: { dimension: 'device', metrics: ['sessions', 'sales', 'conversion_rate'], dateRange: '30d' } },

    // Customer Reports
    { id: 'sys_geographic', name: 'Geographic Sales', type: 'SYSTEM', category: 'Customer', config: { dimension: 'country', metrics: ['sales', 'orders', 'sessions'], dateRange: '30d' } },
    { id: 'sys_customer_performance', name: 'Top Customers', type: 'SYSTEM', category: 'Customer', config: { dimension: 'customer', metrics: ['sales', 'orders'], dateRange: '90d' } },
    { id: 'sys_new_customers', name: 'New Customers', type: 'SYSTEM', category: 'Customer', config: { dimension: 'day', metrics: ['new_customers', 'sales'], dateRange: '30d' } },

    // Conversion Reports
    { id: 'sys_conversion', name: 'Conversion Report', type: 'SYSTEM', category: 'Conversion', config: { dimension: 'day', metrics: ['sessions', 'orders', 'conversion_rate'], dateRange: '30d' } }
];

const SYSTEM_CONFIGS: Record<string, any> = {
    'sys_overview': { dimension: 'day', metrics: ['sales', 'orders', 'aov'], dateRange: '30d' },
    'sys_products': { dimension: 'product', metrics: ['quantity', 'sales', 'orders'], dateRange: '30d' },
    'sys_top_sellers': { dimension: 'product', metrics: ['sales', 'quantity'], dateRange: '90d' },
    'sys_order_status': { dimension: 'order_status', metrics: ['orders', 'sales'], dateRange: '30d' },
    'sys_category_performance': { dimension: 'category', metrics: ['sales', 'orders', 'quantity'], dateRange: '30d' },
    'sys_traffic_sources': { dimension: 'traffic_source', metrics: ['sessions', 'visitors', 'conversion_rate'], dateRange: '30d' },
    'sys_campaigns': { dimension: 'utm_source', metrics: ['sessions', 'sales', 'conversion_rate'], dateRange: '30d' },
    'sys_devices': { dimension: 'device', metrics: ['sessions', 'sales', 'conversion_rate'], dateRange: '30d' },
    'sys_geographic': { dimension: 'country', metrics: ['sales', 'orders', 'sessions'], dateRange: '30d' },
    'sys_customer_performance': { dimension: 'customer', metrics: ['sales', 'orders'], dateRange: '90d' },
    'sys_new_customers': { dimension: 'day', metrics: ['new_customers', 'sales'], dateRange: '30d' },
    'sys_conversion': { dimension: 'day', metrics: ['sessions', 'orders', 'conversion_rate'], dateRange: '30d' }
};

// Templates
router.get('/templates', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const accountId = (req as any).accountId;
        const userTemplates = await prisma.reportTemplate.findMany({
            where: { accountId }, orderBy: { createdAt: 'desc' }
        });
        res.json([...SYSTEM_TEMPLATES, ...userTemplates]);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/templates', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const accountId = (req as any).accountId;
        const { name, config } = req.body;
        const template = await prisma.reportTemplate.create({
            data: { accountId, name, config, type: 'CUSTOM' }
        });
        res.json(template);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/templates/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const accountId = (req as any).accountId;
        await prisma.reportTemplate.delete({ where: { id: req.params.id, accountId } });
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Schedules
router.get('/schedules', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const accountId = (req as any).accountId;
        const schedules = await prisma.reportSchedule.findMany({
            where: { accountId }, include: { template: true }
        });
        res.json(schedules);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/schedules', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const accountId = (req as any).accountId;
        const { templateId, frequency, dayOfWeek, dayOfMonth, time, emailRecipients, isActive } = req.body;

        let targetTemplateId = templateId;

        if (templateId.startsWith('sys_')) {
            const config = SYSTEM_CONFIGS[templateId];
            if (!config) return res.status(400).json({ error: 'Invalid System Template' });

            const clone = await prisma.reportTemplate.create({
                data: { accountId, name: `System Clone: ${templateId}`, type: 'SYSTEM_CLONE', config }
            });
            targetTemplateId = clone.id;
        }

        const schedule = await prisma.reportSchedule.create({
            data: { accountId, reportTemplateId: targetTemplateId, frequency, dayOfWeek, dayOfMonth, time, emailRecipients, isActive: isActive ?? true }
        });
        res.json(schedule);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
