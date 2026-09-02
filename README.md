# Social Express

Sistema de gestão com dashboard para provas, retiradas, devoluções, resultados financeiros, contas e agenda.

## Desenvolvimento

```bash
npm install
npm run dev
```

## CRM WhatsApp (Railway + Evolution)

Guia completo: [`docs/CRM-EVOLUTION-RAILWAY.md`](docs/CRM-EVOLUTION-RAILWAY.md)

Resumo:

1. Suba a **Evolution API** no Railway (Docker + Postgres)
2. Configure `crm-bridge/.env` com a URL e API key
3. `npm run crm:bridge:install && npm run crm:bridge`
4. No front, `.env.local` com `VITE_CRM_BRIDGE_URL=http://localhost:3333`
5. Abra **/crm** e escaneie o QR

Sem bridge configurado, o CRM roda em **modo demo**.

## Build

```bash
npm run build
npm run preview
```
