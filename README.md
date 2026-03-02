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

## Configuração (Google Cloud)
1. No Google Cloud Console, crie/seleciona um projeto.
2. Ative a Google Calendar API.
3. Configure a tela de consentimento OAuth.
4. Crie credenciais OAuth 2.0 (Aplicativo da Web):
   - URI de redirecionamento: `http://localhost:3000/oauth/google/callback`
   - Copie Client ID/Secret para `.env`.

Variáveis de ambiente:
- `PORT`: porta do servidor (padrão 3000)
- `VERTICAL`: `dentistry` ou `veterinary`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI`
- `GOOGLE_CALENDAR_ID` (opcional; pode ser definido por tenant)

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

Para persistir tokens OAuth no Docker, monte um volume para `data/`:
- `docker run -p 3000:3000 --env-file .env -v $(pwd)/data:/app/data clinic-agent`

## Como usar
1. Suba a aplicação: `npm run dev` (ou Docker com `.env`).
2. Healthcheck: `GET http://localhost:3000/health`.
3. Conecte um tenant ao Google Calendar (abra no navegador):
   - `http://localhost:3000/oauth/google/auth?tenantId=clinicaA&calendarId=primary`
   - Complete o consent; tokens ficam em `data/tokens.json`.
4. (Opcional) Ajuste o calendário do tenant: `POST /tenants/clinicaA/config { "calendarId": "primary" }`.
5. Defina a vertical desejada no `.env` (`VERTICAL=dentistry|veterinary`).

## Como testar (curl)
- Health:
```
curl -s http://localhost:3000/health
```

- Verificar tokens (dev):
```
curl -s http://localhost:3000/tenants/clinicaA/tokens
```

- Consultar disponibilidade:
```
curl -s -X POST http://localhost:3000/webhook \
  -H 'Content-Type: application/json' \
  -d '{
    "type":"availability",
    "payload": { "date":"2026-03-01", "tenantId":"clinicaA" }
  }'
```

- Efetuar agendamento:
```
curl -s -X POST http://localhost:3000/webhook \
  -H 'Content-Type: application/json' \
  -d '{
    "type":"book",
    "payload": {
      "serviceKey":"consult",
      "start":"2026-03-01T14:00:00-03:00",
      "patient": { "name":"Ana", "email":"ana@example.com" },
      "tenantId":"clinicaA"
    }
  }'
```

Notas:
- Timezone vem de `config/<vertical>.yml`.
- Serviços e durações são definidos em `services` do YAML; `slot_duration_minutes` define o tamanho de cada slot.
- Para trocar de vertical (ex.: veterinária), ajuste `VERTICAL` e o YAML correspondente.
