import 'dotenv/config';
import Fastify from 'fastify';
import { loadConfig } from './config';
import { logger } from './utils/logger';
import { GoogleCalendarProvider } from './adapters/calendar/google/GoogleCalendarProvider';
import { SchedulingService } from './services/SchedulingService';
import { Agent } from './agent/Agent';
import { registerWebhookRoutes } from './channels/webhook/WebhookController';
import { google } from 'googleapis';

async function main() {
  const cfg = loadConfig();
  const app = Fastify({ logger: false });

  // Health
  app.get('/health', async () => ({ ok: true, vertical: cfg.vertical }));

  // Minimal OAuth callback endpoint (token exchange is TODO)
  app.get('/oauth/google/callback', async (req, reply) => {
    return reply.send({ status: 'ok', note: 'Implement token exchange + persistence.' });
  });

  // Google OAuth client factory using env
  const oauthFactory = () => {
    const oauth2 = new google.auth.OAuth2(cfg.google.clientId, cfg.google.clientSecret, cfg.google.redirectUri);
    return oauth2;
  };

  const calendar = new GoogleCalendarProvider(cfg.google.calendarId, oauthFactory);
  const scheduling = new SchedulingService(calendar, cfg);
  const agent = new Agent(scheduling);

  registerWebhookRoutes(app, { agent });

  await app.listen({ port: cfg.port, host: '0.0.0.0' });
  logger.info(`HTTP up on :${cfg.port} [${cfg.vertical}]`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

