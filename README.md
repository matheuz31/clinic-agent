# Clinic Agent (Dentistry/Veterinary)

Assistente conversacional para clínicas (odontologia por padrão), com integração ao Google Calendar e arquitetura genérica para alternar verticais (ex.: veterinária) via configuração.

## Principais recursos
- API HTTP com webhook para canais externos.
- Integração Google Calendar (listar/criar compromissos) via provedor.
- Engine de agendamento e regras por vertical.
- Configuração por ambiente e YAML (ex.: `VERTICAL=dentistry`).

## Stack
- Node.js + TypeScript
- Fastify (HTTP) • `googleapis` (Calendar) • `zod` (validação)

## Início rápido
1. Pré‑requisitos: Node 18+.
2. Copie `.env.example` para `.env` e preencha:
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
   - `GOOGLE_CALENDAR_ID` (ou deixe para fornecer via payload/tenant)
   - `VERTICAL` = `dentistry` ou `veterinary`
3. Instale deps: `npm install`
4. Dev: `npm run dev`

### OAuth Google (multi‑clínica)
- Iniciar consent: `GET /oauth/google/auth?tenantId={TENANT}&calendarId={CALENDAR_ID?}`
- Callback salva tokens: `GET /oauth/google/callback?code=...`
- Definir/atualizar agenda por tenant: `POST /tenants/{TENANT}/config {"calendarId":"..."}`
- Checar status (dev): `GET /tenants/{TENANT}/tokens`

## Google Calendar
- Desenvolvimento/local: OAuth (User consent) usando `GOOGLE_REDIRECT_URI` apontando para `/oauth/google/callback`.
- Produção multi‑clínica: considerar Service Account + delegação (se Google Workspace) ou fluxo OAuth por clínica (multi‑tenant).

## Estrutura
```
src/
  index.ts                  # Boot HTTP
  config/                   # Env + YAML por vertical
  agent/Agent.ts            # Núcleo de decisões (stub)
  services/SchedulingService.ts
  adapters/
    calendar/
      CalendarProvider.ts
      google/GoogleCalendarProvider.ts
  channels/webhook/WebhookController.ts
  channels/types.ts
config/
  dentistry.yml
  veterinary.yml
```

## Roadmap curto
- [x] Fluxo OAuth inicial + persistência JSON
- [x] Disponibilidade por horário de funcionamento + conflitos do Google Calendar
- [x] Validação Zod para `/webhook`
- [x] Multi‑clínica: calendarId por tenant
- [ ] Conector de canal (ex.: WhatsApp/Twilio)
- [ ] Testes e CI

## Scripts
- `npm run dev` — dev com ts-node-dev
- `npm run build` — compila para `dist/`
- `npm start` — roda build

## Docker
- Build: `docker build -t clinic-agent .`
- Run: `docker run -p 3000:3000 --env-file .env clinic-agent`

## Próximos passos (amanhã)
- [ ] Completar OAuth: trocar `code` por tokens, persistir `access/refresh` (ex.: SQLite/Prisma ou JSON) e implementar refresh automático.
- [ ] Calcular disponibilidade real: gerar slots a partir de `opening_hours` + timezone e remover conflitos do Google Calendar.
- [ ] Validar payloads: contratos `zod` para `/webhook` (book/availability) e respostas.
- [ ] Multi‑clínica: permitir `calendarId` por clínica/tenant e endpoint de configuração simples.
- [ ] Canal inicial: definir adapter (ex.: WhatsApp/Twilio) e interface de mensagens.
- [ ] Deploy: Dockerfile, variáveis `.env`, e guia rápido de publicação.
