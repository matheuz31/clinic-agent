import { FastifyInstance } from 'fastify';
import { Agent } from '../../agent/Agent';
import { WebhookSchema } from '../../schemas/webhook';

export function registerWebhookRoutes(app: FastifyInstance, deps: { agent: Agent }) {
  app.post('/webhook', async (req, reply) => {
    const body: any = req.body ?? {};
    const parsed = WebhookSchema.safeParse(body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid payload', details: parsed.error.flatten() });
    }
    const res = await deps.agent.handle(parsed.data as any);
    return reply.send(res);
  });
}
