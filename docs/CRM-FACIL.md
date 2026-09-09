## CRM Comercial — Social Express

Fluxo simples e intuitivo:

1. **Novo contato** → Nome, Número, Dia do evento, Traje  
2. O **valor estimado** vem do catálogo e atualiza o potencial na hora  
3. Classifique: **Ganho**, **Perdido** ou **Em aberto**  
4. A aba **Análise** (pizza) atualiza em tempo real e mostra o **histórico** dos contatos  
5. A aba **Sequências** configura 3 chamadas de reengajamento no WhatsApp  

### Navegação
As abas ficam no **topo** (estilo Produtos): Contatos · Análise · Sequências · Trajes e valores · Novo contato.

### Sequência de chamadas
Para leads **em aberto** que param de responder:
- Defina 1ª, 2ª e 3ª chamada (dias de espera + texto com `{NOME}`)
- A fila lista quem já venceu o prazo
- **Enviar no WhatsApp** abre o `wa.me` com a mensagem pronta e marca a etapa como enviada
- Ganho/Perdido pausa a sequência automaticamente

### Trajes e valores
Cadastre o catálogo (ex.: Azul Marinho R$ 480). Ao escolher o traje no contato, o potencial muda automaticamente.

### Como iniciar
```powershell
cd C:\Users\USER\Desktop\socialexpress
git pull origin cursor/clarial-dashboard-db05
npm run dev
```
Abra `/crm`.
