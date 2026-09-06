## CRM WhatsApp oficial — Meta Cloud API

O WhatsApp **não** se conecta pelo Google. O caminho oficial da própria Meta é a **WhatsApp Cloud API**.

```
Cliente manda WhatsApp → Meta Cloud API → webhook → crm-bridge → CRM /crm
```

- Sem QR de aparelho conectado
- Sem Evolution / Railway de API não-oficial
- Só **mensagens novas** (a API oficial não entrega histórico antigo do app pessoal)
- Usa um **número WhatsApp Business** (não é o mesmo fluxo do WhatsApp pessoal comum)

---

### 1) Conta Meta

1. Crie/acesse [developers.facebook.com](https://developers.facebook.com)
2. Crie um **App** → tipo **Business**
3. Adicione o produto **WhatsApp**
4. Em **WhatsApp → API Setup** anote:
   - **Temporary access token** (depois troque por token permanente do System User)
   - **Phone number ID**
   - Número de teste da Meta (ou o seu número Business)

5. Em **Business Manager**, vincule a conta WhatsApp Business (WABA)

### 2) Variáveis do `crm-bridge`

Em `crm-bridge/.env`:

```env
PORT=3333
PUBLIC_BRIDGE_URL=https://SEU-TUNEL-OU-DOMINIO

META_ACCESS_TOKEN=EAAB...seu-token
META_PHONE_NUMBER_ID=123456789012345
META_VERIFY_TOKEN=socialexpress-verify-troque
```

`META_VERIFY_TOKEN` é uma senha **sua** — a mesma que você cola no painel da Meta no webhook.

### 3) URL pública do webhook (obrigatória)

A Meta **só** envia mensagens para HTTPS público.

**Local (teste):**
```powershell
ngrok http 3333
```
Copie a URL `https://....ngrok-free.app` para `PUBLIC_BRIDGE_URL`.

**Produção:** publique o `crm-bridge` no Railway e use o domínio HTTPS dele.

Webhook a cadastrar na Meta:
```
https://SEU-DOMINIO/api/webhook/meta
```

No App Meta → WhatsApp → Configuration → Webhook:
- Callback URL: `https://SEU-DOMINIO/api/webhook/meta`
- Verify token: o mesmo de `META_VERIFY_TOKEN`
- Inscreva o campo **messages**

### 4) Frontend

Na raiz, `.env.local`:
```env
VITE_CRM_BRIDGE_URL=http://localhost:3333
```

### 5) Ligar e testar

Terminal 1:
```powershell
cd C:\Users\USER\Desktop\socialexpress\crm-bridge
npm start
```

Terminal 2:
```powershell
cd C:\Users\USER\Desktop\socialexpress
npm run dev
```

1. Abra `/crm`
2. Clique **Conectar WhatsApp oficial**
3. No número Business (ou número de teste Meta), mande uma mensagem
4. O lead aparece no pipeline

### 6) Teste sem Meta (simulação)

Com o bridge ligado:
```powershell
curl -X POST http://localhost:3333/api/whatsapp/simulate -H "Content-Type: application/json" -d "{\"phone\":\"5548999887766\",\"pushName\":\"Cliente Teste\",\"text\":\"Quero terno azul para casamento dia 20/10\"}"
```

Depois abra o CRM conectado — o lead deve existir.

### Limitações importantes

| Expectativa | Realidade |
| --- | --- |
| Usar WhatsApp pessoal com QR | Cloud API usa número **Business** |
| Puxar conversas antigas | Não — só mensagens **depois** do webhook |
| Google login puxar WhatsApp | Não existe — WhatsApp é da Meta |
| Webhook em localhost puro | Não — precisa ngrok/Railway |

### Problemas comuns

| Sintoma | Checar |
| --- | --- |
| `META_ACCESS_TOKEN` inválido | Token expirado (temporário dura ~24h) |
| Webhook verification failed | `META_VERIFY_TOKEN` igual no .env e na Meta |
| Conectou mas não chega msg | `PUBLIC_BRIDGE_URL` HTTPS + campo `messages` inscrito |
| 403 no GET do webhook | Verify token diferente |
