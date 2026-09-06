## CRM fácil e automático

Não precisa conectar WhatsApp no site.

```
WhatsApp no celular (normal)
        ↓ você copia a conversa
   CRM → Colar conversa → IA → lead no pipeline
```

Ou:

```
Cliente preenche /captura → lead no CRM
```

### Como usar

1. `npm run dev`
2. Abra `http://localhost:5173/crm`

#### Colar conversa
1. No WhatsApp, copie as mensagens
2. CRM → **Colar conversa**
3. Cole o texto → **Analisar e salvar**
4. A IA preenche nome, evento, data, traje e score

#### Novo lead
1. CRM → **Novo lead**
2. Nome / WhatsApp / observação
3. **Criar lead**

#### Formulário público
1. CRM → **Formulário**
2. Salve o WhatsApp da loja
3. Copie o link `/captura` para a bio do Instagram ou tablet
4. Cliente preenche → lead nasce (no mesmo navegador da loja) ou manda WhatsApp pronto

### Pipeline
Etiquetas: Novo, Sem resposta, Acompanhar, Agendamento, Pago, Perdido  
Pontuação configurável em **Pontuação**.

### Limitação
Os dados ficam neste navegador (localStorage). Para equipe em vários PCs no futuro, dá para sincronizar com um servidor — sem voltar para QR/Evolution.
