## CRM WhatsApp real — Railway + Evolution API

Este guia liga o CRM do Social Express ao **seu WhatsApp** via **Evolution API** hospedada no **Railway** (sem VPS próprio).

### Arquitetura

```
Celular (QR) → Evolution API (Railway)
                    ↓ webhook
              crm-bridge (local ou Railway)
                    ↓
              Frontend /crm
```

A API key da Evolution **não** fica no navegador — só no `crm-bridge`.

---

### 1) Conta Railway

1. Crie conta em [railway.app](https://railway.app)
2. **New Project**
3. Adicione um banco **PostgreSQL** (Add Plugin → PostgreSQL)

### 2) Serviço Evolution

Opção A — Docker image direta:

1. **New Service** → **Docker Image**
2. Image: `atendai/evolution-api:v2.2.3`
3. Porta: `8080`
4. Variables (ajuste com o Postgres do Railway):

```env
SERVER_URL=https://SEU-SERVICO.up.railway.app
AUTHENTICATION_API_KEY=uma-chave-secreta-bem-grande
DATABASE_ENABLED=true
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=${{Postgres.DATABASE_URL}}
DATABASE_SAVE_DATA_INSTANCE=true
DATABASE_SAVE_DATA_NEW_MESSAGE=true
DATABASE_SAVE_MESSAGE_UPDATE=true
DATABASE_SAVE_DATA_CONTACTS=true
DATABASE_SAVE_DATA_CHATS=true
LANGUAGE=pt-BR
```

> Em alguns planos o `DATABASE_URL` do Railway usa `postgres://` — se a Evolution reclamar, troque o prefixo para `postgresql://`.

5. Gere o domínio público (Settings → Networking → Generate Domain)
6. Atualize `SERVER_URL` com esse domínio HTTPS

Opção B — pasta `evolution/` deste repo (Dockerfile) no deploy a partir do GitHub.

### 3) crm-bridge (no seu PC, para testar)

```bash
cd crm-bridge
cp .env.example .env
npm install
```

Edite `.env`:

```env
PORT=3333
EVOLUTION_BASE_URL=https://SEU-SERVICO.up.railway.app
EVOLUTION_API_KEY=a-mesma-chave-do-AUTHENTICATION_API_KEY
EVOLUTION_INSTANCE=social-express
PUBLIC_BRIDGE_URL=http://localhost:3333
```

**Webhook:** a Evolution precisa alcançar o bridge. Em local use um túnel:

```bash
# exemplo com ngrok
ngrok http 3333
```

Coloque a URL HTTPS do ngrok em `PUBLIC_BRIDGE_URL`.

Suba o bridge:

```bash
npm run crm:bridge
```

### 4) Frontend

Na raiz do projeto, crie `.env.local`:

```env
VITE_CRM_BRIDGE_URL=http://localhost:3333
```

(ou use o proxy `/crm-api` já configurado no Vite)

```bash
npm run dev
```

Abra **CRM** → **Conectar WhatsApp (Evolution)** → escaneie o QR no celular  
(WhatsApp → Aparelhos conectados → Conectar um aparelho).

### 5) O que já funciona neste protótipo

- QR real da Evolution
- Status connected / connecting / disconnected
- Webhook de mensagens → cria/atualiza leads
- IA local (evento, data, traje, score)
- Etiquetas no CRM (abas)
- Backups no bridge (`crm-bridge/data`)

### 6) Próximos passos (quando quiser)

- Publicar o `crm-bridge` também no Railway (webhook sem ngrok)
- Sync nativo de etiquetas do WhatsApp Business (quando a Evolution expor)
- IA com provedor externo (OpenAI etc.)

### Problemas comuns

| Sintoma | O que checar |
| --- | --- |
| `Evolution não configurada` | `.env` do bridge |
| QR não aparece | `SERVER_URL` da Evolution = domínio HTTPS público |
| Conectou e caiu | celular na internet; não desconecte em Aparelhos conectados |
| Webhook não chega | `PUBLIC_BRIDGE_URL` precisa ser HTTPS público (ngrok/Railway) |
| 401 na Evolution | `AUTHENTICATION_API_KEY` igual no Railway e no bridge |

### Modo simulado

Sem `VITE_CRM_BRIDGE_URL`, o CRM continua no **modo demo** (QR simulado) para desenvolvimento visual.
