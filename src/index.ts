import 'dotenv/config';
import Fastify from 'fastify';
import { loadConfig } from './config';
import { logger } from './utils/logger';
import { GoogleCalendarProvider } from './adapters/calendar/google/GoogleCalendarProvider';
import { SchedulingService } from './services/SchedulingService';
import { Agent } from './agent/Agent';
import { registerWebhookRoutes } from './channels/webhook/WebhookController';
import { google } from 'googleapis';
import { TokenStore } from './store/TokenStore';

async function main() {
  const cfg = loadConfig();
  const app = Fastify({ logger: false });
  const tokens = new TokenStore();

  // Health
  app.get('/health', async () => ({ ok: true, vertical: cfg.vertical }));

  // OAuth: start consent
  app.get('/oauth/google/auth', async (req, reply) => {
    const { tenantId, calendarId, prompt } = (req.query as any) ?? {};
    if (!tenantId) return reply.code(400).send({ error: 'tenantId requerido' });
    const oauth2 = oauthFactory();
    const scopes = ['https://www.googleapis.com/auth/calendar'];
    const state = Buffer.from(JSON.stringify({ tenantId, calendarId })).toString('base64url');
    const url = oauth2.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: (prompt as string) || 'consent',
      state,
    });
    reply.redirect(url);
  });

  // OAuth: callback with code
  app.get('/oauth/google/callback', async (req, reply) => {
    const { code, state } = (req.query as any) ?? {};
    if (!code) return reply.code(400).send({ error: 'code ausente' });
    const { tenantId, calendarId } = state ? JSON.parse(Buffer.from(state, 'base64url').toString()) : {};
    if (!tenantId) return reply.code(400).send({ error: 'tenantId ausente no state' });
    const oauth2 = oauthFactory();
    const { tokens: tk } = await oauth2.getToken(code);
    tokens.set(tenantId, {
      access_token: tk.access_token,
      refresh_token: tk.refresh_token,
      scope: tk.scope,
      token_type: tk.token_type,
      expiry_date: tk.expiry_date,
      calendarId: calendarId || undefined,
    });
    return reply.send({ ok: true, tenantId, hasRefreshToken: Boolean(tk.refresh_token) });
  });

  // Tenant config: set calendarId
  app.post('/tenants/:tenantId/config', async (req, reply) => {
    const { tenantId } = req.params as any;
    const body = (req.body as any) ?? {};
    if (!body.calendarId) return reply.code(400).send({ error: 'calendarId requerido' });
    tokens.setCalendar(tenantId, body.calendarId);
    return reply.send({ ok: true });
  });

  // Debug: get tokens (do not expose in production)
  app.get('/tenants/:tenantId/tokens', async (req, reply) => {
    const { tenantId } = req.params as any;
    const t = tokens.get(tenantId);
    return reply.send({ tenantId, hasTokens: Boolean(t?.refresh_token), calendarId: t?.calendarId });
  });

  // Google OAuth client factory using env
  const oauthFactory = () => {
    const oauth2 = new google.auth.OAuth2(cfg.google.clientId, cfg.google.clientSecret, cfg.google.redirectUri);
    return oauth2;
  };

  const calendar = new GoogleCalendarProvider(cfg.google.calendarId, oauthFactory);
  const scheduling = new SchedulingService(calendar, cfg, tokens);
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
