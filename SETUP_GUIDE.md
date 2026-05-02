# 🚀 FinFlow — Guia de Inicialização Rápida

Este documento contém o passo a passo para subir todo o ambiente de desenvolvimento. Siga esta ordem para garantir que as dependências estejam prontas.

---

## 1. Banco de Dados (Docker)
O banco de dados é a fundação. Ele precisa estar rodando para o backend funcionar.
```bash
# Na raiz do projeto:
docker compose -f docker-compose.dev.yml up postgres -d
```
*   **Verificação:** O container `finflow_db` deve aparecer como "Healthy" no Docker Desktop.

---

## 2. Backend (Porta 3001)
Com o banco rodando, suba o servidor Node.js.
```bash
cd backend
npm install       # (Apenas se houver novas dependências)
npm run dev
```
*   **Acesso:** `http://localhost:3001`
*   **Prisma Studio (Opcional):** Para ver os dados visualmente, em outro terminal na pasta `backend`: `npx prisma studio` (`http://localhost:5555`).

---

## 3. Frontend (Porta 3000)
Agora ligue a interface Next.js.
```bash
cd frontend
pnpm install      # (Apenas se houver novas dependências)
pnpm dev
```
*   **Acesso:** `http://localhost:3000`
*   **Login Demo:** `paul@demo.com` | `demo1234`

---

## 4. Testes (Qualidade)
Para garantir que nada quebrou após suas alterações.
```bash
cd backend
npm test
```
*   **O que ele testa:** Rota de Login e conectividade com o banco.

---

## 💡 Dicas de Manutenção (Se algo quebrar)

### O banco está vazio?
Se você apagou os volumes do Docker, rode o comando abaixo na pasta `backend` para recriar as tabelas e o usuário Paul Demo:
```bash
npx prisma migrate dev
npm run db:seed
```

### O Postman parou de funcionar?
Consulte o guia **`backend/API_TEST_GUIDE.md`** para pegar o script de automação do Token e os novos endpoints de CRUD.

### Mudanças no Banco?
Se você alterar o arquivo `schema.prisma`, lembre-se de rodar `npx prisma migrate dev` para atualizar o banco e gerar os novos tipos TypeScript automaticamente.

---
**Até amanhã! O projeto está 100% pronto para a ação.** 🚀📊
