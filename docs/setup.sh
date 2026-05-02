#!/bin/bash
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 FinFlow — criando estrutura do projeto...${NC}\n"

mkdir -p finflow/{backend/src/{routes,controllers,middleware,lib,types},backend/prisma,frontend,scripts,.claude}
cd finflow

# ============================================================
# .env.example
# ============================================================
cat > .env.example << 'EOF'
# Database
DATABASE_URL="postgresql://finflow:finflow123@localhost:5432/finflow_db"

# Backend
PORT=3001
JWT_SECRET=supersecret_troque_em_producao
NODE_ENV=development

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF

cp .env.example .env
echo -e "${GREEN}✓ .env criado${NC}"

# ============================================================
# docker-compose.yml (produção / desenvolvimento)
# ============================================================
cat > docker-compose.yml << 'EOF'
version: '3.9'

services:
  # ── Banco de dados ──────────────────────────────────────────
  postgres:
    image: postgres:16-alpine
    container_name: finflow_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: finflow
      POSTGRES_PASSWORD: finflow123
      POSTGRES_DB: finflow_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U finflow -d finflow_db"]
      interval: 5s
      timeout: 5s
      retries: 5

  # ── Backend (Node/Express) ───────────────────────────────────
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: finflow_api
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://finflow:finflow123@postgres:5432/finflow_db
      PORT: 3001
      JWT_SECRET: ${JWT_SECRET:-supersecret_troque_em_producao}
      NODE_ENV: production
    ports:
      - "3001:3001"

  # ── Frontend (Next.js) ───────────────────────────────────────
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: finflow_web
    restart: unless-stopped
    depends_on:
      - backend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001
    ports:
      - "3000:3000"

volumes:
  postgres_data:
EOF

# ============================================================
# docker-compose.dev.yml (hot reload)
# ============================================================
cat > docker-compose.dev.yml << 'EOF'
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    container_name: finflow_db
    environment:
      POSTGRES_USER: finflow
      POSTGRES_PASSWORD: finflow123
      POSTGRES_DB: finflow_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U finflow -d finflow_db"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    container_name: finflow_api_dev
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://finflow:finflow123@postgres:5432/finflow_db
      PORT: 3001
      JWT_SECRET: supersecret_dev
      NODE_ENV: development
    ports:
      - "3001:3001"
    volumes:
      - ./backend/src:/app/src          # hot reload do src
      - ./backend/prisma:/app/prisma    # migrations em tempo real
      - /app/node_modules               # preserva node_modules do container

  # Frontend roda fora do Docker em dev (next dev é mais rápido)
  # Execute: cd frontend && npm run dev

volumes:
  postgres_data:
EOF
echo -e "${GREEN}✓ docker-compose criados${NC}"

# ============================================================
# backend/Dockerfile (produção)
# ============================================================
cat > backend/Dockerfile << 'EOF'
FROM node:20-alpine AS base
WORKDIR /app

# Dependências
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

# Build
FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Runner
FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma

EXPOSE 3001

# Roda migrations e sobe o servidor
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
EOF

# ============================================================
# backend/Dockerfile.dev (hot reload)
# ============================================================
cat > backend/Dockerfile.dev << 'EOF'
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate

EXPOSE 3001

CMD ["npm", "run", "dev"]
EOF
echo -e "${GREEN}✓ Dockerfiles do backend criados${NC}"

# ============================================================
# backend/package.json
# ============================================================
cat > backend/package.json << 'EOF'
{
  "name": "finflow-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts",
    "db:reset": "prisma migrate reset --force"
  },
  "dependencies": {
    "@prisma/client": "^5.13.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.23.4"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/node": "^20.12.7",
    "prisma": "^5.13.0",
    "tsx": "^4.9.3",
    "typescript": "^5.4.5"
  }
}
EOF

# ============================================================
# backend/tsconfig.json
# ============================================================
cat > backend/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# ============================================================
# prisma/schema.prisma
# ============================================================
cat > backend/prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String        @id @default(cuid())
  email        String        @unique
  name         String
  passwordHash String
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  transactions Transaction[]

  @@index([email])
}

model Category {
  id           String        @id @default(cuid())
  name         String        @unique
  color        String        @default("#6366f1")
  icon         String        @default("💰")
  transactions Transaction[]
}

model Transaction {
  id          String          @id @default(cuid())
  description String
  amount      Decimal         @db.Decimal(12, 2)
  type        TransactionType
  date        DateTime
  notes       String?
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  categoryId String
  category   Category @relation(fields: [categoryId], references: [id])

  @@index([userId, date])      // consultas filtradas por usuário + data
  @@index([userId, type])      // agrupamentos por tipo
}

enum TransactionType {
  INCOME
  EXPENSE
}
EOF

# ============================================================
# prisma/seed.ts
# ============================================================
cat > backend/prisma/seed.ts << 'EOF'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Categorias padrão
  const categories = await Promise.all([
    prisma.category.upsert({ where: { name: 'Salário' },    update: {}, create: { name: 'Salário',    color: '#22c55e', icon: '💼' } }),
    prisma.category.upsert({ where: { name: 'Freelance' },  update: {}, create: { name: 'Freelance',  color: '#3b82f6', icon: '💻' } }),
    prisma.category.upsert({ where: { name: 'Alimentação'},  update: {}, create: { name: 'Alimentação',color: '#f59e0b', icon: '🍔' } }),
    prisma.category.upsert({ where: { name: 'Transporte' }, update: {}, create: { name: 'Transporte', color: '#8b5cf6', icon: '🚗' } }),
    prisma.category.upsert({ where: { name: 'Moradia' },    update: {}, create: { name: 'Moradia',    color: '#ec4899', icon: '🏠' } }),
    prisma.category.upsert({ where: { name: 'Lazer' },      update: {}, create: { name: 'Lazer',      color: '#06b6d4', icon: '🎮' } }),
  ])

  // Usuário demo
  const user = await prisma.user.upsert({
    where: { email: 'paul@demo.com' },
    update: {},
    create: {
      email: 'paul@demo.com',
      name: 'Paul Demo',
      passwordHash: await bcrypt.hash('demo1234', 10),
    },
  })

  // Transações de exemplo
  const now = new Date()
  await prisma.transaction.createMany({
    skipDuplicates: true,
    data: [
      { description: 'Salário mensal',   amount: 8000, type: 'INCOME',  date: new Date(now.getFullYear(), now.getMonth(), 5),  userId: user.id, categoryId: categories[0].id },
      { description: 'Projeto Freelance',amount: 2500, type: 'INCOME',  date: new Date(now.getFullYear(), now.getMonth(), 12), userId: user.id, categoryId: categories[1].id },
      { description: 'Supermercado',     amount: 450,  type: 'EXPENSE', date: new Date(now.getFullYear(), now.getMonth(), 8),  userId: user.id, categoryId: categories[2].id },
      { description: 'Uber',             amount: 120,  type: 'EXPENSE', date: new Date(now.getFullYear(), now.getMonth(), 15), userId: user.id, categoryId: categories[3].id },
      { description: 'Aluguel',          amount: 1800, type: 'EXPENSE', date: new Date(now.getFullYear(), now.getMonth(), 1),  userId: user.id, categoryId: categories[4].id },
      { description: 'Netflix + Spotify',amount: 65,   type: 'EXPENSE', date: new Date(now.getFullYear(), now.getMonth(), 10), userId: user.id, categoryId: categories[5].id },
    ],
  })

  console.log('✅ Seed concluído — usuário demo: paul@demo.com / demo1234')
}

main().catch(console.error).finally(() => prisma.$disconnect())
EOF

# ============================================================
# backend/src/index.ts
# ============================================================
cat > backend/src/index.ts << 'EOF'
import app from './app'

const PORT = process.env.PORT ?? 3001

app.listen(PORT, () => {
  console.log(`🚀 API rodando em http://localhost:${PORT}`)
  console.log(`📦 Ambiente: ${process.env.NODE_ENV}`)
})
EOF

# ============================================================
# backend/src/app.ts
# ============================================================
cat > backend/src/app.ts << 'EOF'
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth'
import transactionRoutes from './routes/transactions'
import categoryRoutes from './routes/categories'
import { errorHandler } from './middleware/errorHandler'

const app = express()

// Middlewares globais
app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:3000' }))
app.use(express.json())

// Rota de health check
app.get('/health', (_, res) => res.json({ status: 'ok', ts: new Date() }))

// Rotas da aplicação
app.use('/api/auth',         authRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/categories',   categoryRoutes)

// Handler global de erros (sempre por último)
app.use(errorHandler)

export default app
EOF

# ============================================================
# backend/src/lib/prisma.ts
# ============================================================
cat > backend/src/lib/prisma.ts << 'EOF'
import { PrismaClient } from '@prisma/client'

// Singleton para evitar múltiplas conexões em dev (hot reload)
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
EOF

# ============================================================
# backend/src/types/index.ts
# ============================================================
cat > backend/src/types/index.ts << 'EOF'
import { Request } from 'express'

export interface AuthRequest extends Request {
  userId?: string
}

export interface JWTPayload {
  userId: string
  email: string
}
EOF

# ============================================================
# backend/src/middleware/auth.ts
# ============================================================
cat > backend/src/middleware/auth.ts << 'EOF'
import { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AuthRequest, JWTPayload } from '../types'

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' })
  }

  try {
    const token = authHeader.split(' ')[1]
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    req.userId = payload.userId
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' })
  }
}
EOF

# ============================================================
# backend/src/middleware/errorHandler.ts
# ============================================================
cat > backend/src/middleware/errorHandler.ts << 'EOF'
import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Dados inválidos', details: err.flatten().fieldErrors })
  }
  console.error(err)
  return res.status(500).json({ error: 'Erro interno do servidor' })
}
EOF

# ============================================================
# backend/src/routes/auth.ts
# ============================================================
cat > backend/src/routes/auth.ts << 'EOF'
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

const router = Router()

const registerSchema = z.object({
  name:     z.string().min(2),
  email:    z.string().email(),
  password: z.string().min(8),
})

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string(),
})

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = registerSchema.parse(req.body)

    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) return res.status(409).json({ error: 'E-mail já cadastrado' })

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({ data: { name, email, passwordHash } })

    const token = jwt.sign({ userId: user.id, email }, process.env.JWT_SECRET!, { expiresIn: '7d' })
    return res.status(201).json({ token, user: { id: user.id, name, email } })
  } catch (err) { next(err) }
})

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body)

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' })

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return res.status(401).json({ error: 'Credenciais inválidas' })

    const token = jwt.sign({ userId: user.id, email }, process.env.JWT_SECRET!, { expiresIn: '7d' })
    return res.json({ token, user: { id: user.id, name: user.name, email } })
  } catch (err) { next(err) }
})

// GET /api/auth/me
router.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Não autenticado' })
    const token = authHeader.split(' ')[1]
    const { userId } = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true } })
    return res.json(user)
  } catch (err) { next(err) }
})

export default router
EOF

# ============================================================
# backend/src/routes/transactions.ts
# ============================================================
cat > backend/src/routes/transactions.ts << 'EOF'
import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'
import { AuthRequest } from '../types'

const router = Router()
router.use(requireAuth)

const transactionSchema = z.object({
  description: z.string().min(1),
  amount:      z.number().positive(),
  type:        z.enum(['INCOME', 'EXPENSE']),
  date:        z.string().datetime(),
  categoryId:  z.string(),
  notes:       z.string().optional(),
})

// GET /api/transactions?page=1&limit=10&type=EXPENSE&from=2024-01-01&to=2024-12-31
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { page = '1', limit = '10', type, from, to, categoryId } = req.query

    const where: Record<string, unknown> = { userId: req.userId }
    if (type)       where.type = type
    if (categoryId) where.categoryId = categoryId
    if (from || to) where.date = { ...(from ? { gte: new Date(from as string) } : {}), ...(to ? { lte: new Date(to as string) } : {}) }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { category: true },
        orderBy: { date: 'desc' },
        skip:  (Number(page) - 1) * Number(limit),
        take:  Number(limit),
      }),
      prisma.transaction.count({ where }),
    ])

    return res.json({ data: transactions, meta: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) } })
  } catch (err) { next(err) }
})

// GET /api/transactions/summary — totais por categoria
router.get('/summary', async (req: AuthRequest, res, next) => {
  try {
    const { from, to } = req.query
    const dateFilter = from || to
      ? { date: { ...(from ? { gte: new Date(from as string) } : {}), ...(to ? { lte: new Date(to as string) } : {}) } }
      : {}

    const [income, expense, byCategory] = await Promise.all([
      prisma.transaction.aggregate({ where: { userId: req.userId, type: 'INCOME', ...dateFilter }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { userId: req.userId, type: 'EXPENSE', ...dateFilter }, _sum: { amount: true } }),
      prisma.transaction.groupBy({
        by: ['categoryId'],
        where: { userId: req.userId, type: 'EXPENSE', ...dateFilter },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
      }),
    ])

    const categories = await prisma.category.findMany({ where: { id: { in: byCategory.map(b => b.categoryId) } } })
    const categorySummary = byCategory.map(b => ({ ...categories.find(c => c.id === b.categoryId), total: b._sum.amount }))

    return res.json({
      income:   income._sum.amount  ?? 0,
      expense:  expense._sum.amount ?? 0,
      balance:  Number(income._sum.amount ?? 0) - Number(expense._sum.amount ?? 0),
      byCategory: categorySummary,
    })
  } catch (err) { next(err) }
})

// POST /api/transactions
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const data = transactionSchema.parse(req.body)
    const transaction = await prisma.transaction.create({
      data: { ...data, amount: data.amount, date: new Date(data.date), userId: req.userId! },
      include: { category: true },
    })
    return res.status(201).json(transaction)
  } catch (err) { next(err) }
})

// PUT /api/transactions/:id
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const exists = await prisma.transaction.findFirst({ where: { id: req.params.id, userId: req.userId } })
    if (!exists) return res.status(404).json({ error: 'Transação não encontrada' })

    const data = transactionSchema.partial().parse(req.body)
    const transaction = await prisma.transaction.update({
      where: { id: req.params.id },
      data: { ...data, ...(data.date ? { date: new Date(data.date) } : {}) },
      include: { category: true },
    })
    return res.json(transaction)
  } catch (err) { next(err) }
})

// DELETE /api/transactions/:id
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const exists = await prisma.transaction.findFirst({ where: { id: req.params.id, userId: req.userId } })
    if (!exists) return res.status(404).json({ error: 'Transação não encontrada' })
    await prisma.transaction.delete({ where: { id: req.params.id } })
    return res.status(204).send()
  } catch (err) { next(err) }
})

export default router
EOF

# ============================================================
# backend/src/routes/categories.ts
# ============================================================
cat > backend/src/routes/categories.ts << 'EOF'
import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

router.get('/', async (_, res, next) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } })
    return res.json(categories)
  } catch (err) { next(err) }
})

export default router
EOF

echo -e "${GREEN}✓ Backend criado${NC}"

# ============================================================
# frontend/Dockerfile
# ============================================================
cat > frontend/Dockerfile << 'EOF'
FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
EOF
echo -e "${GREEN}✓ Dockerfile do frontend criado${NC}"

# ============================================================
# CLAUDE.md — raiz do projeto (contexto global)
# ============================================================
cat > CLAUDE.md << 'EOF'
# FinFlow — Personal Finance Dashboard

## Stack
| Camada    | Tech                              | Porta |
|-----------|-----------------------------------|-------|
| Frontend  | Next.js 14 (App Router) TypeScript| 3000  |
| Backend   | Node.js + Express + TypeScript    | 3001  |
| ORM       | Prisma 5                          | —     |
| Database  | PostgreSQL 16                     | 5432  |

## Comandos essenciais

```bash
# Subir tudo (dev)
docker compose -f docker-compose.dev.yml up -d
cd frontend && npm run dev

# Banco
cd backend && npm run db:migrate    # nova migration
cd backend && npm run db:studio     # Prisma Studio (UI do banco)
cd backend && npm run db:seed       # popular com dados demo

# Instalar deps
cd backend && npm install
cd frontend && npm install
```

## Arquitetura do backend
```
Request → Express Router → Middleware (auth/zod) → Controller → Prisma → PostgreSQL
```

## Regras deste projeto
- Validação com Zod SEMPRE antes de tocar no banco
- Nunca expor passwordHash em respostas
- Todos os endpoints de /api/transactions exigem JWT
- Erros sempre passam pelo next(err) → errorHandler global
- Índices no Prisma: @@index([userId, date]) e @@index([userId, type])

## Variáveis de ambiente
Ver `.env.example`. Em dev copiar para `.env`.

## Usuário demo (após seed)
- Email: paul@demo.com  
- Senha: demo1234

## Deploy
| Serviço   | Plataforma   | Grátis |
|-----------|--------------|--------|
| Frontend  | Vercel       | ✅     |
| Backend   | Render       | ✅     |
| Database  | Neon         | ✅     |
EOF

# ============================================================
# backend/CLAUDE.md — contexto específico do backend
# ============================================================
cat > backend/CLAUDE.md << 'EOF'
# Backend — Node/Express/Prisma

## Estrutura
```
src/
  index.ts          → inicia o servidor (app.listen)
  app.ts            → configura Express (cors, routes, errorHandler)
  lib/prisma.ts     → singleton do Prisma Client
  types/index.ts    → AuthRequest, JWTPayload
  middleware/
    auth.ts         → requireAuth (verifica JWT, injeta req.userId)
    errorHandler.ts → captura Zod + erros genéricos
  routes/
    auth.ts         → POST /register, POST /login, GET /me
    transactions.ts → CRUD + GET /summary
    categories.ts   → GET /categories
```

## Padrão de rota
```typescript
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    // lógica aqui
    return res.json(result)
  } catch (err) { next(err) } // SEMPRE passar pro errorHandler
})
```

## Prisma queries mais usadas
```typescript
// Buscar com paginação
prisma.transaction.findMany({ where, include: { category: true }, orderBy: { date: 'desc' }, skip, take })

// Agregação (totais)
prisma.transaction.aggregate({ where, _sum: { amount: true } })

// Agrupar por categoria
prisma.transaction.groupBy({ by: ['categoryId'], where, _sum: { amount: true } })
```

## Schema (tabelas principais)
- User: id, email, name, passwordHash
- Category: id, name, color, icon
- Transaction: id, description, amount, type(INCOME|EXPENSE), date, userId, categoryId
EOF

# ============================================================
# frontend/CLAUDE.md
# ============================================================
cat > frontend/CLAUDE.md << 'EOF'
# Frontend — Next.js 14 App Router

## Estrutura esperada
```
app/
  (auth)/
    login/page.tsx
    register/page.tsx
  (dashboard)/
    layout.tsx       → verifica auth, sidebar
    page.tsx         → dashboard com summary
    transactions/
      page.tsx       → listagem + filtros
      new/page.tsx   → formulário
lib/
  api.ts             → fetch wrapper com token JWT
  auth.ts            → helpers de autenticação
components/
  ui/                → shadcn components
  charts/            → Recharts wrappers
```

## Fetch da API
```typescript
// lib/api.ts — sempre usar este wrapper
async function apiFetch(path: string, options?: RequestInit) {
  const token = localStorage.getItem('token')
  return fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options?.headers },
  })
}
```

## Variáveis de ambiente
- NEXT_PUBLIC_API_URL=http://localhost:3001
EOF

# ============================================================
# .claude/settings.json — configurações do Claude Code
# ============================================================
cat > .claude/settings.json << 'EOF'
{
  "permissions": {
    "allow": [
      "Bash(npm run *)",
      "Bash(npx prisma *)",
      "Bash(docker compose *)",
      "Bash(git *)",
      "Bash(cat *)",
      "Bash(ls *)",
      "Bash(mkdir *)",
      "Bash(cp *)",
      "Bash(mv *)"
    ],
    "deny": [
      "Bash(rm -rf /)",
      "Bash(sudo rm *)"
    ]
  }
}
EOF

# ============================================================
# .mcp.json — MCP servers para Claude Code
# ============================================================
cat > .mcp.json << 'EOF'
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."],
      "description": "Acesso ao sistema de arquivos do projeto"
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://finflow:finflow123@localhost:5432/finflow_db"],
      "description": "Query direto no PostgreSQL via Claude"
    }
  }
}
EOF

# ============================================================
# scripts/dev.sh — atalho para subir tudo
# ============================================================
cat > scripts/dev.sh << 'EOF'
#!/bin/bash
echo "🐳 Subindo PostgreSQL..."
docker compose -f docker-compose.dev.yml up postgres -d

echo "⏳ Aguardando banco ficar saudável..."
until docker exec finflow_db pg_isready -U finflow -d finflow_db 2>/dev/null; do sleep 1; done

echo "📦 Instalando dependências do backend..."
cd backend && npm install

echo "🗄️  Rodando migrations..."
npx prisma migrate dev --name init 2>/dev/null || npx prisma migrate deploy

echo "🌱 Populando banco com dados demo..."
npm run db:seed

echo "🚀 Subindo backend em background..."
npm run dev &
BACKEND_PID=$!

echo "📦 Instalando dependências do frontend..."
cd ../frontend && npm install 2>/dev/null || true

echo ""
echo "✅ Tudo pronto!"
echo "   API:     http://localhost:3001"
echo "   Frontend: http://localhost:3000 (rodar: cd frontend && npm run dev)"
echo "   Banco:   npx prisma studio"
echo ""
echo "Pressione Ctrl+C para parar o backend"
wait $BACKEND_PID
EOF
chmod +x scripts/dev.sh

echo -e "\n${GREEN}✅ Projeto FinFlow criado com sucesso!${NC}\n"
echo -e "${YELLOW}Próximos passos:${NC}"
echo -e "  1. ${BLUE}cd finflow${NC}"
echo -e "  2. ${BLUE}docker compose -f docker-compose.dev.yml up postgres -d${NC}"
echo -e "  3. ${BLUE}cd backend && npm install && npm run db:migrate && npm run db:seed${NC}"
echo -e "  4. ${BLUE}npm run dev${NC}  ← backend rodando em :3001"
echo -e "  5. ${BLUE}cd ../frontend && npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias '@/*'${NC}"
echo -e "  6. ${BLUE}npm run dev${NC}  ← frontend rodando em :3000"
echo ""
echo -e "${YELLOW}Para abrir no VS Code:${NC} ${BLUE}code finflow/${NC}"
echo -e "${YELLOW}Prisma Studio (UI do banco):${NC} ${BLUE}cd backend && npm run db:studio${NC}"
