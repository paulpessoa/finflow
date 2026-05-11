# FinFlow - Personal Finance Dashboard

[![FinFlow Demo](docs/finflow-demo.gif)](https://finflow-orpin.vercel.app)

FinFlow é um painel de controle de finanças pessoais completo, focado em performance, segurança e usabilidade. Este projeto foi desenvolvido utilizando uma stack moderna e práticas de engenharia "production-ready".

## 🚀 Tecnologias

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS 4
- **Gerenciamento de Estado:** React Query (TanStack Query)
- **Formulários:** React Hook Form + Zod
- **Gráficos:** Recharts

### Backend
- **Framework:** Node.js + Express
- **ORM:** Prisma 5
- **Banco de Dados:** PostgreSQL
- **Autenticação:** JWT (JSON Web Tokens) com Cookies seguros

---

## 💻 Como rodar localmente

### Pré-requisitos
- Docker e Docker Compose (para o banco de dados)
- Node.js (versão 20 ou superior)
- Gerenciador de pacotes (npm)

### Passo 1: Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto e dentro das pastas `backend` e `frontend` conforme os exemplos:

**Raiz e Backend (`backend/.env`):**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/finflow?schema=public"
JWT_SECRET="sua_chave_secreta_aqui"
PORT=3001
```

**Frontend (`frontend/.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_NODE_API_URL=http://localhost:3001
NEXT_PUBLIC_GO_API_URL=http://localhost:3002
```

### Passo 2: Subir o Banco de Dados
```bash
docker-compose -f docker-compose.dev.yml up postgres -d
```

### Passo 3: Configurar o Backend
```bash
cd backend
npm install
npx prisma migrate dev  # Aplica as migrations
npm run db:seed         # Opcional: cria usuário demo (paul@demo.com | demo1234)
npm run dev
```

### Passo 4: Configurar o Frontend
```bash
cd ../frontend
npm install
npm run dev
```

O sistema estará disponível em: `http://localhost:3000`

---

## 🌐 Deploy (Produção)

### URL do Backend Node.js (Render)
A API está hospedada em: [https://finflow-l05o.onrender.com](https://finflow-l05o.onrender.com)

### URL do Backend Golang (Render)
A API está hospedada em: [https://finflow-1-a2aj.onrender.com](https://finflow-1-a2aj.onrender.com)

### URL do Frontend (Vercel)
A interface está disponível em: [https://finflow-orpin.vercel.app](https://finflow-orpin.vercel.app)

### Versão HTMX (Render)
A versão do dashboard feita com HTMX está disponível em: [https://finflow-htmx.onrender.com/](https://finflow-htmx.onrender.com/)

### Backend Python (Em Breve)
Estamos desenvolvendo uma nova versão do backend utilizando Python (FastAPI), que estará disponível em um novo endpoint em breve.

---

## ⚙️ Configuração de Variáveis em Produção

### No Render (Backend):
- `DATABASE_URL`: URL do banco de dados PostgreSQL de produção.
- `JWT_SECRET`: Uma string aleatória forte.
- `PORT`: 3001

### Na Vercel (Frontend):
- `NEXT_PUBLIC_NODE_API_URL`: `https://finflow-l05o.onrender.com`
- `NEXT_PUBLIC_GO_API_URL`: `https://finflow-1-a2aj.onrender.com`
- `NEXT_PUBLIC_API_URL`: `https://finflow-l05o.onrender.com` (Fallback)

> **Nota Importante:** **NUNCA** coloque `http://localhost:3001` na configuração de produção do Render ou Vercel. O `localhost` serve apenas para o seu computador local. No servidor, o frontend precisa do endereço público do backend para conseguir "conversar" com ele.
