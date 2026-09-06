# Social Express

Sistema de gestão com dashboard para provas, retiradas, devoluções, resultados financeiros, contas e agenda.

## Desenvolvimento

```bash
npm install
npm run dev
```

## CRM WhatsApp (oficial — Meta Cloud API)

Guia completo: [`docs/CRM-WHATSAPP-CLOUD.md`](docs/CRM-WHATSAPP-CLOUD.md)

Resumo:

1. Crie app WhatsApp no [Meta for Developers](https://developers.facebook.com)
2. Configure `crm-bridge/.env` com `META_ACCESS_TOKEN`, `META_PHONE_NUMBER_ID`, `META_VERIFY_TOKEN`
3. Exponha o bridge com HTTPS (`ngrok` ou Railway) e cadastre o webhook `/api/webhook/meta`
4. `npm run crm:bridge` + `npm run dev` com `VITE_CRM_BRIDGE_URL=http://localhost:3333`
5. Abra **/crm** → **Conectar WhatsApp oficial**

Sem bridge configurado, o CRM roda em **modo demo**.  
Evolution/QR (legado): [`docs/CRM-EVOLUTION-RAILWAY.md`](docs/CRM-EVOLUTION-RAILWAY.md).

## Build

```bash
npm run build
npm run preview
```
