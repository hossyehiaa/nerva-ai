import { db } from '@/lib/db';

interface WorkflowAction {
  type: string;
  config?: Record<string, unknown>;
}

/**
 * Workflow Engine - Executes workflow actions when triggers fire.
 * This runs server-side and handles the actual automation logic.
 */
export class WorkflowEngine {
  /**
   * Fire a trigger event and run all matching active workflows
   */
  static async fireTrigger(trigger: string, businessId: string, data: Record<string, unknown> = {}) {
    const workflows = await db.workflow.findMany({
      where: {
        businessId,
        trigger,
        status: 'active',
      },
    });

    for (const workflow of workflows) {
      await this.executeWorkflow(workflow.id, data);
    }
  }

  /**
   * Execute a single workflow's actions
   */
  static async executeWorkflow(workflowId: string, data: Record<string, unknown> = {}) {
    const workflow = await db.workflow.findUnique({ where: { id: workflowId } });
    if (!workflow || workflow.status !== 'active') return;

    let actions: WorkflowAction[] = [];
    try {
      actions = JSON.parse(workflow.actions);
    } catch {
      return;
    }

    const results: { action: string; success: boolean; error?: string }[] = [];

    for (const action of actions) {
      try {
        const result = await this.executeAction(action, workflow.businessId, data);
        results.push({ action: action.type, success: true, ...result });
      } catch (error) {
        results.push({ action: action.type, success: false, error: String(error) });
      }
    }

    // Update lastRunAt
    await db.workflow.update({
      where: { id: workflowId },
      data: { lastRunAt: new Date() },
    });

    return results;
  }

  /**
   * Execute a single action
   */
  private static async executeAction(
    action: WorkflowAction,
    businessId: string,
    data: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    switch (action.type) {
      case 'email':
        return await this.sendEmailAction(businessId, data, action.config);

      case 'whatsapp':
        return await this.sendWhatsAppAction(businessId, data, action.config);

      case 'update_lead':
        return await this.updateLeadAction(businessId, data, action.config);

      case 'webhook':
        return await this.callWebhookAction(businessId, data, action.config);

      default:
        return { message: `Unknown action type: ${action.type}` };
    }
  }

  /**
   * Send email notification (logs + stores in conversation for now)
   */
  private static async sendEmailAction(
    businessId: string,
    data: Record<string, unknown>,
    config?: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const business = await db.business.findUnique({ where: { id: businessId } });
    if (!business) return { message: 'Business not found' };

    const recipient = (config?.recipient as string) || business.user?.email || 'owner';
    const subject = (config?.subject as string) || 'Nerva AI Notification';
    const body = this.interpolateTemplate(
      (config?.body as string) || 'New event triggered: {{trigger}}',
      { ...data, businessName: business.name }
    );

    // Store as conversation record for tracking
    await db.conversation.create({
      data: {
        businessId,
        role: 'assistant',
        content: `[EMAIL] To: ${recipient} | Subject: ${subject} | Body: ${body}`,
      },
    });

    return { message: `Email notification logged for ${recipient}`, subject, body };
  }

  /**
   * Send WhatsApp notification (via Evolution API or logs)
   */
  private static async sendWhatsAppAction(
    businessId: string,
    data: Record<string, unknown>,
    config?: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const business = await db.business.findUnique({ where: { id: businessId } });
    if (!business) return { message: 'Business not found' };

    const number = (config?.number as string) || business.whatsappNumber || '';
    const message = this.interpolateTemplate(
      (config?.message as string) || 'New event: {{trigger}}',
      { ...data, businessName: business.name }
    );

    // If WhatsApp is connected, try to send via Evolution API
    if (business.whatsappInstance && number) {
      try {
        const evoUrl = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
        const evoKey = process.env.EVOLUTION_API_KEY || '';

        await fetch(`${evoUrl}/message/sendText/${business.whatsappInstance}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evoKey,
          },
          body: JSON.stringify({
            number,
            textMessage: { text: message },
          }),
        });

        return { message: `WhatsApp sent to ${number}` };
      } catch {
        // Fallback to logging
      }
    }

    // Log the WhatsApp message as conversation
    await db.conversation.create({
      data: {
        businessId,
        role: 'assistant',
        content: `[WHATSAPP] To: ${number} | Message: ${message}`,
      },
    });

    return { message: `WhatsApp notification logged for ${number}` };
  }

  /**
   * Update lead status
   */
  private static async updateLeadAction(
    businessId: string,
    data: Record<string, unknown>,
    config?: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const leadId = (data.leadId as string) || (config?.leadId as string);
    const newStatus = (config?.status as string) || 'contacted';

    if (!leadId) {
      return { message: 'No lead ID provided' };
    }

    const validStatuses = ['new', 'contacted', 'qualified', 'converted', 'lost'];
    if (!validStatuses.includes(newStatus)) {
      return { message: `Invalid status: ${newStatus}` };
    }

    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (!lead || lead.businessId !== businessId) {
      return { message: 'Lead not found' };
    }

    await db.lead.update({
      where: { id: leadId },
      data: { status: newStatus },
    });

    return { message: `Lead ${leadId} status updated to ${newStatus}` };
  }

  /**
   * Call an external webhook
   */
  private static async callWebhookAction(
    businessId: string,
    data: Record<string, unknown>,
    config?: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const url = config?.url as string;
    const method = (config?.method as string) || 'POST';

    if (!url) {
      return { message: 'No webhook URL provided' };
    }

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          trigger: data.trigger || 'unknown',
          data,
          timestamp: new Date().toISOString(),
        }),
      });

      return {
        message: `Webhook called: ${url}`,
        status: response.status,
        ok: response.ok,
      };
    } catch (error) {
      return { message: `Webhook failed: ${String(error)}` };
    }
  }

  /**
   * Simple template interpolation: replaces {{key}} with values
   */
  private static interpolateTemplate(template: string, data: Record<string, unknown>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return String(data[key] ?? match);
    });
  }
}
