import { FastifyInstance } from 'fastify';
import { Agent } from '../../agent/Agent';

export function registerWebhookRoutes(app: FastifyInstance, deps: { agent: Agent }) {
  app.post('/webhook', async (req, reply) => {
    const body: any = req.body ?? {};
    const type = body.type ?? 'unknown';
    const payload = body.payload ?? {};
    const res = await deps.agent.handle({ type, payload });
    return reply.send(res);
  });
}

