# Guia: Claude Code no FinFlow

## O que cada arquivo faz

| Arquivo | Função |
|---|---|
| `CLAUDE.md` (raiz) | Contexto global: stack, comandos, regras. Lido automaticamente ao abrir o projeto |
| `backend/CLAUDE.md` | Contexto do backend: estrutura de pastas, padrões de rota, queries Prisma |
| `frontend/CLAUDE.md` | Contexto do frontend: estrutura esperada, como fazer fetch da API |
| `.claude/settings.json` | Permissões: quais comandos bash o Claude pode rodar sem pedir confirmação |
| `.mcp.json` | MCP servers: filesystem e postgres — Claude consegue ler arquivos e rodar queries SQL |

---

## Como instalar o Claude Code

```bash
npm install -g @anthropic-ai/claude-code
```

Abrir o projeto:
```bash
cd finflow
claude
```

---

## Comandos úteis dentro do Claude Code

| Comando | O que faz |
|---|---|
| `/compact` | Compacta o histórico da conversa (economiza tokens) |
| `/clear` | Limpa o contexto completamente (nova sessão) |
| `/cost` | Mostra quantos tokens foram usados na sessão |
| `#arquivo.ts` | Adiciona um arquivo específico ao contexto |
| `/doctor` | Verifica se tudo está configurado corretamente |

---

## Estratégia de tokens para este projeto

**Regra de ouro: sessões curtas e focadas**

❌ Errado — pedir tudo de uma vez:
> "Cria o sistema de auth completo, com login, register, JWT, middleware, e também o frontend"

✅ Correto — uma tarefa por sessão:
> "Cria a rota POST /api/auth/register com validação Zod e hash bcrypt. O schema do Prisma já está em backend/prisma/schema.prisma"

---

## Prompts otimizados por tarefa

### Criar uma nova rota
```
Cria a rota GET /api/transactions/summary em backend/src/routes/transactions.ts
seguindo o padrão já existente. Deve retornar: total de income, total de expense,
balance, e array de expense por categoria com o nome e cor da categoria.
Usa as queries Prisma de aggregate e groupBy como estão em CLAUDE.md.
```

### Criar um componente React
```
Cria o componente TransactionList em frontend/components/TransactionList.tsx
Usa fetch da API via lib/api.ts (já existe). 
Endpoint: GET /api/transactions?page=1&limit=10
Mostra tabela com: data, descrição, categoria (com cor), valor (verde=income, vermelho=expense)
Usa Tailwind para estilizar. TypeScript strict.
```

### Debugar um erro
```
Erro ao rodar npm run db:migrate:
[cola o erro aqui]
O schema está em backend/prisma/schema.prisma
```

---

## MCP Postgres — queries direto no banco

Depois de instalar o MCP, dentro do Claude Code você pode pedir:
```
Mostra todas as transações do usuário paul@demo.com agrupadas por categoria
```

E o Claude vai rodar o SQL diretamente no seu banco local.

Para instalar o MCP do postgres:
```bash
npx @anthropic-ai/claude-code --add-mcp-server postgres
# ou editar .mcp.json manualmente (já está criado)
```

---

## Deploy gratuito — passo a passo

### 1. Database — Neon (PostgreSQL gratuito)
1. Criar conta em https://neon.tech
2. New Project → nome: finflow
3. Copiar a connection string (formato: `postgresql://...`)
4. Substituir no `.env` de produção

### 2. Backend — Render
1. Criar conta em https://render.com
2. New → Web Service → conectar seu repositório GitHub
3. Root Directory: `backend`
4. Build Command: `npm install && npx prisma generate && npm run build`
5. Start Command: `npx prisma migrate deploy && node dist/index.js`
6. Environment Variables: adicionar `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`
7. URL gerada: `https://finflow-api.onrender.com` → copiar para o próximo passo

> ⚠️ Free tier do Render "adormece" após 15min de inatividade. Para portfólio é aceitável.

### 3. Frontend — Vercel
1. Criar conta em https://vercel.com
2. New Project → importar repositório → Root Directory: `frontend`
3. Framework: Next.js (detectado automaticamente)
4. Environment Variables: `NEXT_PUBLIC_NODE_API_URL`, `NEXT_PUBLIC_GO_API_URL`, `NEXT_PUBLIC_API_URL` (fallback)
5. Deploy

### Resumo de custos
| Serviço | Plano | Limite gratuito |
|---|---|---|
| Neon | Free | 0.5 GB storage, 1 projeto |
| Render | Free | 750h/mês de compute |
| Vercel | Hobby | 100 GB bandwidth, deploys ilimitados |

**Total: $0/mês** para portfolio/demonstração.

---

## Para o NotebookLM

Depois de construir o projeto, jogue no NotebookLM:
1. Este arquivo (`CLAUDE-CODE-GUIDE.md`)
2. `CLAUDE.md` raiz
3. `backend/CLAUDE.md`
4. `backend/prisma/schema.prisma`
5. `backend/src/app.ts` + `backend/src/routes/transactions.ts`
6. `backend/src/middleware/auth.ts`

Perguntas sugeridas para gerar o áudio:
- "Explica o fluxo de uma requisição autenticada do frontend até o banco"
- "Quais são os índices do banco e por que foram escolhidos?"
- "Como funciona o errorHandler global?"
- "O que é o singleton do Prisma e por que ele existe?"
