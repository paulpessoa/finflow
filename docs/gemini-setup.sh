#!/bin/bash
# Roda dentro da pasta finflow/
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}⚙️  Configurando Gemini CLI para o FinFlow...${NC}\n"

mkdir -p .gemini

# ============================================================
# GEMINI.md — raiz (lido automaticamente ao abrir o projeto)
# ============================================================
cat > GEMINI.md << 'EOF'
# FinFlow — Personal Finance Dashboard

## Stack
| Camada   | Tech                           | Porta |
|----------|--------------------------------|-------|
| Frontend | Next.js 14 App Router + TS     | 3000  |
| Backend  | Node.js + Express + TypeScript | 3001  |
| ORM      | Prisma 5                       | —     |
| Database | PostgreSQL 16                  | 5432  |

## Comandos essenciais
```bash
# Dev
docker compose -f docker-compose.dev.yml up postgres -d
cd backend && npm run dev          # API :3001
cd frontend && npm run dev         # Web :3000

# Banco
cd backend && npm run db:migrate   # nova migration
cd backend && npm run db:studio    # UI do banco (Prisma Studio)
cd backend && npm run db:seed      # dados demo
```

## Arquitetura da requisição
```
Request → Express Router → Middleware(auth+zod) → Controller → Prisma → PostgreSQL
```

## Regras do projeto
- Validação Zod SEMPRE antes de tocar no banco
- Nunca expor `passwordHash` em respostas
- Endpoints `/api/transactions/*` exigem JWT Bearer
- Erros sempre via `next(err)` → errorHandler global
- Índices: `@@index([userId, date])` e `@@index([userId, type])`

## Contexto adicional
@backend/GEMINI.md
@frontend/GEMINI.md
EOF

# ============================================================
# backend/GEMINI.md
# ============================================================
cat > backend/GEMINI.md << 'EOF'
# Backend — Node/Express/Prisma

## Estrutura
```
src/
  index.ts           → app.listen
  app.ts             → Express setup (cors, routes, errorHandler)
  lib/prisma.ts      → singleton PrismaClient
  types/index.ts     → AuthRequest, JWTPayload
  middleware/
    auth.ts          → requireAuth (JWT → req.userId)
    errorHandler.ts  → ZodError + genéricos
  routes/
    auth.ts          → POST /register, POST /login, GET /me
    transactions.ts  → CRUD + GET /summary
    categories.ts    → GET /
```

## Padrão de rota obrigatório
```typescript
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const result = await prisma.transaction.findMany({ where: { userId: req.userId } })
    return res.json(result)
  } catch (err) { next(err) }  // SEMPRE
})
```

## Queries Prisma mais usadas
```typescript
// Lista paginada com relação
prisma.transaction.findMany({ where, include: { category: true }, orderBy: { date: 'desc' }, skip, take })

// Totais (income/expense)
prisma.transaction.aggregate({ where: { userId, type: 'INCOME' }, _sum: { amount: true } })

// Agrupado por categoria
prisma.transaction.groupBy({ by: ['categoryId'], where, _sum: { amount: true }, orderBy: { _sum: { amount: 'desc' } } })
```

## Schema resumido
| Model       | Campos principais                                       |
|-------------|--------------------------------------------------------|
| User        | id, email, name, passwordHash                          |
| Category    | id, name, color, icon                                  |
| Transaction | id, description, amount, type(INCOME\|EXPENSE), date, userId, categoryId |

## Usuário demo (após seed)
- Email: paul@demo.com | Senha: demo1234
EOF

# ============================================================
# frontend/GEMINI.md
# ============================================================
cat > frontend/GEMINI.md << 'EOF'
# Frontend — Next.js 14 App Router

## Estrutura esperada
```
app/
  (auth)/login/page.tsx
  (auth)/register/page.tsx
  (dashboard)/layout.tsx       → verifica auth, sidebar
  (dashboard)/page.tsx         → summary cards + gráfico
  (dashboard)/transactions/
    page.tsx                   → listagem com filtros e paginação
    new/page.tsx               → formulário nova transação
lib/
  api.ts                       → fetch wrapper com JWT
components/
  charts/SummaryChart.tsx      → Recharts wrapper
  transactions/TransactionList.tsx
  ui/                          → shadcn components
```

## Fetch da API — sempre usar este wrapper
```typescript
// lib/api.ts
const BASE = process.env.NEXT_PUBLIC_API_URL  // http://localhost:3001

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('finflow_token')
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
```

## Endpoints disponíveis na API
| Método | Endpoint                     | Auth | Descrição                  |
|--------|------------------------------|------|----------------------------|
| POST   | /api/auth/register           | ❌   | cadastro                   |
| POST   | /api/auth/login              | ❌   | login → retorna token      |
| GET    | /api/auth/me                 | ✅   | dados do usuário logado    |
| GET    | /api/transactions            | ✅   | lista paginada com filtros |
| POST   | /api/transactions            | ✅   | criar transação            |
| PUT    | /api/transactions/:id        | ✅   | editar transação           |
| DELETE | /api/transactions/:id        | ✅   | remover transação          |
| GET    | /api/transactions/summary    | ✅   | totais + por categoria     |
| GET    | /api/categories              | ✅   | lista de categorias        |

## Env vars
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF

# ============================================================
# .gemini/settings.json — configuração central do Gemini CLI
# ============================================================
cat > .gemini/settings.json << 'EOF'
{
  "theme": "Default",

  "selectedAuthType": "oauth-personal",

  "autoAcceptedTools": [
    "read_file",
    "list_directory",
    "search_file_content",
    "run_shell_command"
  ],

  "tools": {
    "allowed": [
      "read_file",
      "write_file",
      "create_file",
      "list_directory",
      "search_file_content",
      "run_shell_command",
      "move_file",
      "copy_file",
      "make_directory",
      "web_fetch",
      "google_search"
    ]
  },

  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."],
      "description": "Acesso ao sistema de arquivos do projeto"
    },
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://finflow:finflow123@localhost:5432/finflow_db"
      ],
      "description": "Query direto no PostgreSQL"
    }
  },

  "useFilesystemForMemory": true,

  "context": {
    "fileName": ["GEMINI.md"],
    "loadFromIncludeDirectories": true
  },

  "telemetry": {
    "enabled": false
  }
}
EOF

echo -e "${GREEN}✓ .gemini/settings.json criado${NC}"
echo -e "${GREEN}✓ GEMINI.md (raiz) criado${NC}"
echo -e "${GREEN}✓ backend/GEMINI.md criado${NC}"
echo -e "${GREEN}✓ frontend/GEMINI.md criado${NC}"

# ============================================================
# .geminiignore — o que o Gemini não deve indexar
# ============================================================
cat > .geminiignore << 'EOF'
node_modules/
.next/
dist/
build/
.git/
*.log
.env
.env.local
*.pem
EOF

echo -e "${GREEN}✓ .geminiignore criado${NC}"

# ============================================================
# Instruções para instalar Skills (Anthropic-style) no Gemini
# ============================================================
cat > .gemini/SKILLS-SETUP.md << 'EOF'
# Skills no Gemini CLI

O Gemini CLI suporta o mesmo formato de Agent Skills do Claude Code
via extensão: github.com/intellectronica/gemini-cli-skillz

## Instalar a extensão de Skills
```bash
gemini extensions install https://github.com/intellectronica/gemini-cli-skillz
# Se der erro 415, responde "Y" para instalar via git clone
```

## Onde ficam as skills
As skills ficam em `~/.skillz/` — uma pasta por skill, cada uma com `SKILL.md`.

## Skills úteis para este projeto
```bash
# Criar a pasta de skills global
mkdir -p ~/.skillz

# Clonar skills de documento da Anthropic (PDF, DOCX, etc.)
cd ~/.skillz
git clone --depth 1 --filter=blob:none --sparse \
  https://github.com/anthropics/skills.git temp
cd temp
git sparse-checkout set document-skills/pdf
mv document-skills/pdf ../
cd ..
rm -rf temp
```

## Criar uma skill customizada para o FinFlow

Crie `~/.skillz/finflow-api/SKILL.md`:

```markdown
# FinFlow API Skill

Use quando o usuário pedir para criar rotas, controllers ou endpoints no backend do FinFlow.

## Padrões obrigatórios
1. Validar com Zod antes de qualquer operação no banco
2. Usar `try/catch` com `next(err)` em todas as rotas
3. Proteger com `requireAuth` middleware quando necessário
4. Incluir `{ category: true }` no include das transações

## Template de rota
\`\`\`typescript
router.METHOD('/path', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const data = schema.parse(req.body)
    const result = await prisma.model.operation({ where: { userId: req.userId } })
    return res.status(CODE).json(result)
  } catch (err) { next(err) }
})
\`\`\`
```

## Verificar se as skills estão carregadas
Dentro do Gemini CLI: `/mcp list` — deve aparecer o servidor `skillz`.
EOF

echo -e "${GREEN}✓ .gemini/SKILLS-SETUP.md criado${NC}"

# ============================================================
# Perfil do agente — system prompt customizado
# ============================================================
cat > .gemini/AGENT-PROFILE.md << 'EOF'
# Perfil do agente Gemini para o FinFlow

Cole este texto como primeira mensagem de cada sessão nova,
ou salve como snippet no VS Code para usar rapidamente.

---

Você é um senior fullstack engineer ajudando a construir o FinFlow,
um dashboard de finanças pessoais com Node.js/Express/Prisma no backend
e Next.js 14 no frontend.

**Regras de resposta:**
- Respostas concisas. Use tabelas em vez de listas longas.
- Sempre escreva TypeScript estrito (sem `any`).
- Siga exatamente os padrões documentados em GEMINI.md.
- Antes de criar um arquivo, verifique se já existe.
- Quando gerar código de rota backend, use sempre o padrão try/catch/next(err).
- Nunca sugira instalar dependências sem confirmar que não existem.

**Contexto atual:**
- Backend Express rodando em :3001
- PostgreSQL rodando via Docker em :5432
- Usuário demo: paul@demo.com / demo1234
- Validação de entrada com Zod em todas as rotas
- Autenticação JWT (7 dias de expiração)

O que você precisa fazer agora?
EOF

echo -e "${GREEN}✓ .gemini/AGENT-PROFILE.md criado${NC}"

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Configuração do Gemini CLI concluída!${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Para instalar o Gemini CLI (se não tiver):${NC}"
echo -e "  npm install -g @google/generative-ai-cli"
echo -e "  # ou"
echo -e "  npm install -g @google/gemini-cli"
echo ""
echo -e "${BLUE}Para instalar as Skills:${NC}"
echo -e "  gemini extensions install https://github.com/intellectronica/gemini-cli-skillz"
echo ""
echo -e "${BLUE}Para abrir o Gemini no projeto:${NC}"
echo -e "  cd finflow && gemini"
echo ""
echo -e "${BLUE}Comandos úteis dentro do Gemini CLI:${NC}"
echo -e "  /memory show     → ver o que foi carregado dos GEMINI.md"
echo -e "  /memory refresh  → recarregar GEMINI.md após edições"
echo -e "  /mcp list        → listar MCP servers conectados"
echo -e "  /stats           → uso de tokens da sessão"
echo -e "  Ctrl+C           → cancelar uma ação em andamento"
