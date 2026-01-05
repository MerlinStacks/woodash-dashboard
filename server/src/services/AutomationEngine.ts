
import { PrismaClient, AutomationEnrollment, MarketingAutomation } from '@prisma/client';
import { EmailService } from './EmailService';

const prisma = new PrismaClient();

interface FlowNode {
    id: string;
    type: string; // 'trigger', 'action', 'delay', 'condition'
    data: any; // { config: {...} }
}

interface FlowEdge {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string | null; // 'true', 'false' for conditions
}

interface FlowDefinition {
    nodes: FlowNode[];
    edges: FlowEdge[];
}

export class AutomationEngine {
    private emailService = new EmailService();

    // Called when an event happens (e.g. Order Created)
    async processTrigger(accountId: string, triggerType: string, data: any) {
        console.log(`[AutomationEngine] Processing Trigger: ${triggerType} for Account ${accountId}`);

        // Find active automations for this trigger
        const automations = await prisma.marketingAutomation.findMany({
            where: {
                accountId,
                triggerType,
                // status: 'ACTIVE' // Use new status enum
                isActive: true // Preserving original field for now, or assume migration handled it. Logic: check both if needed or just isActive
            }
        });

        for (const automation of automations) {
            // Check filters (e.g. min order value) provided in triggerConfig or Trigger Node
            // TODO: Implement Detailed Filter Logic

            await this.enroll(automation, data);
        }
    }

    async enroll(automation: MarketingAutomation, data: any) {
        console.log(`[AutomationEngine] Enrolling ${data.email || 'customer'} in ${automation.name}`);

        let targetEmail = data.email;
        let wooCustomerId = data.wooCustomerId;

        // Extract email from data
        if (!targetEmail && data.billing && data.billing.email) targetEmail = data.billing.email;

        if (!targetEmail) {
            console.warn(`[AutomationEngine] Cannot enroll: No email found in data`);
            return;
        }

        const flow = automation.flowDefinition as unknown as FlowDefinition | null;
        if (!flow || !flow.nodes) {
            console.warn(`[AutomationEngine] No flow definition for ${automation.name}`);
            return;
        }

        // Find Trigger Node to start
        const triggerNode = flow.nodes.find(n => n.type === 'trigger' || n.type === 'TRIGGER');
        if (!triggerNode) {
            console.warn(`[AutomationEngine] No Trigger Node found in flow`);
            return;
        }

        // Create Enrollment
        const enrollment = await prisma.automationEnrollment.create({
            data: {
                automationId: automation.id,
                email: targetEmail,
                wooCustomerId: wooCustomerId,
                contextData: data,
                status: 'ACTIVE',
                currentNodeId: triggerNode.id,
                nextRunAt: new Date() // Ready to run immediately
            }
        });

        // Trigger processing immediately
        await this.processEnrollment(enrollment.id);
    }

    // Cron job or called immediately
    async processEnrollment(enrollmentId: string) {
        const enrollment = await prisma.automationEnrollment.findUnique({
            where: { id: enrollmentId },
            include: { automation: true }
        });

        if (!enrollment || enrollment.status !== 'ACTIVE') return;

        // Check scheduling
        if (enrollment.nextRunAt && enrollment.nextRunAt > new Date()) return;

        const flow = enrollment.automation.flowDefinition as unknown as FlowDefinition | null;
        if (!flow) return;

        let currentNodeId = enrollment.currentNodeId;

        // Loop to process consecutive immediate nodes
        // Safety Break: max 20 steps to prevent infinite loops
        let stepsProcessed = 0;
        const MAX_STEPS = 20;

        while (currentNodeId && stepsProcessed < MAX_STEPS) {
            const node = flow.nodes.find(n => n.id === currentNodeId);
            if (!node) {
                // End of flow or invalid node
                await this.completeEnrollment(enrollmentId);
                return;
            }

            console.log(`[AutomationEngine] Processing Node ${node.id} (${node.type})`);

            // Execute Logic based on Type
            const result = await this.executeNodeLogic(node, enrollment);

            if (result.action === 'WAIT') {
                // Stop processing, we are waiting (Delay)
                // nextRunAt should have been updated by executeNodeLogic if needed, 
                // OR we update it here if the logic returns a duration.
                // Re-fetch enrollment to ensure DB consistent? 
                // executeNodeLogic handles DB updates for 'WAIT'
                return;
            }

            if (result.action === 'NEXT') {
                // Find next node
                const nextNodeId = this.findNextNodeId(flow, node.id, result.outcome);

                if (!nextNodeId) {
                    await this.completeEnrollment(enrollmentId);
                    return;
                }

                // Prepare to move to next node
                // If Next Node is Delay, we need to handle "Entry" logic?
                // Actually, my structure is: "Execute Node" includes "Run the action".
                // Delay Node execution = "Check if we waited enough".

                // ISSUE: If we just move to Delay Node, "Execute" will say "Wait".
                // But we need to set the `nextRunAt` based on entry time.

                // Let's Peek at next node
                const nextNode = flow.nodes.find(n => n.id === nextNodeId);
                let nextRunAt = new Date(); // Default: Run immediately

                if (nextNode && (nextNode.type === 'delay' || nextNode.type === 'DELAY')) {
                    // Calculate Delay
                    const durationMs = this.calculateDelayDuration(nextNode.data);
                    nextRunAt = new Date(Date.now() + durationMs);
                    console.log(`[AutomationEngine] Next is Delay. Scheduling for ${nextRunAt.toISOString()}`);
                }

                // Update DB to move pointer
                const updated = await prisma.automationEnrollment.update({
                    where: { id: enrollmentId },
                    data: {
                        currentNodeId: nextNodeId,
                        nextRunAt: nextRunAt
                    }
                });

                currentNodeId = nextNodeId;
                enrollment.currentNodeId = nextNodeId; // Local update for loop

                // If it's a future wait, break loop
                if (nextRunAt > new Date()) return;
            }

            stepsProcessed++;
        }
    }

    private async executeNodeLogic(node: FlowNode, enrollment: any): Promise<{ action: 'NEXT' | 'WAIT', outcome?: string }> {
        const type = node.type.toUpperCase();

        if (type === 'TRIGGER') {
            return { action: 'NEXT' };
        }

        if (type === 'DELAY') {
            // If we are executing a DELAY node, check if we have waited enough.
            // But processEnrollment only calls us if nextRunAt <= Now.
            // So if we are here, we are done waiting.
            return { action: 'NEXT' };
        }

        if (type === 'ACTION') {
            // e.g. Send Email, Add Tag
            const actionType = node.data?.actionType || 'SEND_EMAIL';

            if (actionType === 'SEND_EMAIL') {
                const config = node.data; // { templateId: "...", subject: "..." }
                console.log(`[AutomationEngine] Sending Email: ${config.templateId} to ${enrollment.email}`);

                try {
                    // Resolve Email Account (prefer config, fallback to first available)
                    let emailAccountId = config.emailAccountId;
                    if (!emailAccountId) {
                        const defaultAccount = await prisma.emailAccount.findFirst({
                            where: { accountId: enrollment.automation.accountId }
                        });
                        emailAccountId = defaultAccount?.id;
                    }

                    if (emailAccountId) {
                        await this.emailService.sendEmail(
                            enrollment.automation.accountId,
                            emailAccountId,
                            enrollment.email,
                            config.subject || 'Automated Email',
                            // TODO: Real template rendering
                            config.body || config.html || `<p>Email Template: ${config.templateId}</p>`
                        );
                    } else {
                        console.warn(`[AutomationEngine] Cannot send email: No Email Account found for Account ${enrollment.automation.accountId}`);
                    }
                } catch (err) {
                    console.error(`[AutomationEngine] Failed to send email`, err);
                }
            }

            return { action: 'NEXT' };
        }

        if (type === 'CONDITION') {
            // Evaluate logic
            // e.g. "Order Total > 100"
            const outcome = await this.evaluateCondition(node.data, enrollment.contextData);
            return { action: 'NEXT', outcome: outcome ? 'true' : 'false' };
        }

        return { action: 'NEXT' };
    }

    private findNextNodeId(flow: FlowDefinition, currentNodeId: string, outcome?: string): string | null {
        // Find edges starting from this node
        const edges = flow.edges.filter(e => e.source === currentNodeId);

        if (edges.length === 0) return null;

        if (edges.length === 1 && !outcome) {
            return edges[0].target;
        }

        // Handle Conditional Edges
        if (outcome) {
            const match = edges.find(e => e.sourceHandle === outcome || e.id === outcome); // handle 'true'/'false' sourceHandle
            // ReactFlow handles usually are 's-id-a' vs 's-id-b'. 
            // We need convention. E.g. Condition Node has handles "true" and "false".

            // Simplification: Check if edge sourceHandle matches outcome
            if (match) return match.target;
        }

        // Fallback: Return first
        return edges[0].target;
    }

    private calculateDelayDuration(data: any): number {
        // data: { duration: 1, unit: 'hours' }
        const val = parseInt(data.value || data.duration || '0');
        const unit = data.unit || 'minutes';

        const multi = {
            'minutes': 60000,
            'hours': 3600000,
            'days': 86400000
        }[unit as string] || 60000;

        return val * multi;
    }

    private async evaluateCondition(data: any, context: any): Promise<boolean> {
        // Simple logic for prototype
        // data: { field: 'total', operator: 'gt', value: 100 }
        if (!data || !context) return true;

        // Extract field from context (flat or nested?)
        // e.g. context = Order { total: 150 }
        const fieldVal = context[data.field];
        const targetVal = data.value;

        switch (data.operator) {
            case 'gt': return fieldVal > targetVal;
            case 'lt': return fieldVal < targetVal;
            case 'eq': return fieldVal == targetVal;
            case 'contains': return String(fieldVal).includes(targetVal);
            default: return true;
        }
    }

    private async completeEnrollment(id: string) {
        console.log(`[AutomationEngine] Enrollment ${id} Completed.`);
        await prisma.automationEnrollment.update({
            where: { id },
            data: { status: 'COMPLETED', nextRunAt: null, currentNodeId: null }
        });
    }

    // Global ticker
    async runTicker() {
        const now = new Date();
        const due = await prisma.automationEnrollment.findMany({
            where: {
                status: 'ACTIVE',
                nextRunAt: { lte: now }
            },
            take: 50
        });

        for (const enr of due) {
            await this.processEnrollment(enr.id);
        }
    }
}
