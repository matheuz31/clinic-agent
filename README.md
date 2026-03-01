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
config/
  dentistry.yml
  veterinary.yml
```

## Roadmap curto
- [ ] Fluxo OAuth completo + refresh token store
- [ ] Regras de horário, bloqueios, confirmações
- [ ] Conectores de canal (WhatsApp, Web, Email)
- [ ] Testes e CI

## Scripts
- `npm run dev` — dev com ts-node-dev
- `npm run build` — compila para `dist/`
- `npm start` — roda build

