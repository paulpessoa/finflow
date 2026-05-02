# Roteiro para NotebookLM — FinFlow System Design

Este documento serve como a base estratégica para gerar o podcast no NotebookLM. Ele explica as decisões "Sênior" tomadas no projeto FinFlow para que a IA consiga discutir o projeto com profundidade técnica.

---

## 1. Visão Geral do Sistema (The Pitch)
O FinFlow é um Dashboard Financeiro Fullstack construído com **Next.js 15 (App Router)** e **Node.js/Prisma**. O sistema foi projetado focando em **escalabilidade horizontal**, **segurança rigorosa** e **experiência do usuário (UX) de alta performance**.

---

## 2. Decisões Estratégicas de Arquitetura (System Design)

### A. Autenticação Stateless (JWT + Bcrypt)
*   **Decisão:** Usamos JWT (JSON Web Tokens) em vez de sessões em banco de dados.
*   **A Analogia do Hambúrguer:** 
    *   **Bcrypt:** Transforma a senha (carne) em um hash (hambúrguer) de forma irreversível. O banco só guarda o hambúrguer.
    *   **JWT:** Funciona como um "Carimbo Mágico" de um clube. O servidor não precisa de uma lista de quem entrou; ele apenas olha o carimbo com "óculos especiais" (a Secret Key) para validar.
*   **Por que Sênior?** Isso torna o backend **Stateless**. Em um System Design real, isso significa que podemos ter 10 instâncias do backend rodando atrás de um Load Balancer sem precisar de um banco de dados central para verificar sessões, facilitando o escalonamento.

### B. Camada de Dados e Cache (TanStack Query)
*   **Decisão:** Centralizamos o estado do servidor no TanStack Query com Custom Hooks.
*   **Por que Sênior?** Em vez de "jogar dados no Redux", usamos uma ferramenta de cache inteligente. Implementamos **Invalidação de Queries por Chaves Hierárquicas** (`queryKeys.transactions.all`). Isso garante consistência de dados: ao deletar um item, o dashboard e a lista se atualizam instantaneamente sem requisições manuais extras.

### C. Segurança e Integridade (Zod + Bcrypt + Prisma)
*   **Decisão:** Validação dupla com Zod (Front e Back) e hashing Bcrypt.
*   **Defesa de Sênior:** 
    *   **Anti-SQL Injection:** O Prisma usa *parameterized queries* por padrão, eliminando riscos de injeção.
    *   **Anti-XSS:** O React trata a sanitização de dados automaticamente na renderização.
    *   **Segurança de Senha:** Uso de Bcrypt com *Salt* de 10 rounds, garantindo que mesmo um vazamento de banco não comprometa as senhas reais.

### F. Otimização de Carregamento (Dynamic Imports)
*   **Decisão:** Uso de `next/dynamic` para os Devtools do TanStack Query.
*   **A Analogia da Mochila Mágica:** 
    *   Imagine que o seu app é um aventureiro. Se ele carregar todas as ferramentas (códigos) na mochila antes de sair de casa, ela fica pesada e ele anda devagar. 
    *   Com o **Dynamic Import**, a mochila é mágica: as ferramentas pesadas só aparecem dentro dela no exato momento em que ele chega no lugar onde vai usá-las. Isso faz o app "correr" (carregar) muito mais rápido!

### H. Estratégias de Escalabilidade e Mensageria (AWS)
*   **EKS (Elastic Kubernetes Service):** 
    *   **Conceito:** Orquestração de containers. 
    *   **Aplicação no FinFlow:** Se o app crescer para milhões de usuários, usaríamos o EKS para gerenciar múltiplos clusters do nosso backend Docker, garantindo alta disponibilidade e auto-scaling.
*   **SQS (Simple Queue Service):** 
    *   **Conceito:** Fila de mensagens assíncronas. 
    *   **Aplicação no FinFlow:** Para tarefas pesadas (ex: processar um extrato bancário de 1 ano ou gerar relatórios em PDF), o backend jogaria a tarefa no SQS para ser processada por um Worker em background, mantendo a API rápida para o usuário.

### I. Roadmap de Segurança Avançada
*   **Access vs Refresh Tokens:** Implementação de tokens de curta duração (15min) e refresh tokens (30 dias) salvos no banco para maior segurança.
*   **Recuperação de Senha:** Fluxo de *Forgot Password* usando tokens temporários e integração com serviço de e-mail (SMTP) para garantir que apenas o dono da conta recupere o acesso.

### D. Performance de Banco de Dados (PostgreSQL + Prisma)
*   **Decisão:** Uso de índices compostos em `(userId, date)` e `(userId, type)`.
*   **Por que Sênior?** Consultas de Dashboard (`groupBy` e `aggregate`) ficam lentas conforme o banco cresce. Esses índices garantem que a busca por transações de um usuário específico seja feita em tempo logarítmico (O(log n)) em vez de linear (O(n)).

---

## 3. Guia de Fontes para o NotebookLM
Para gerar um podcast épico, adicione estes arquivos na ordem:

1.  **Este arquivo** (`docs/notebooklm-roteiro.md`) -> É o "cérebro" da discussão.
2.  **Seu Currículo (PDF)** -> Para ele conectar o projeto à sua experiência.
3.  **Descrições da Vaga (Plank)** -> Para ele focar nos termos que a empresa gosta.
4.  **`backend/prisma/schema.prisma`** -> Mostra a modelagem dos dados.
5.  **`frontend/contexts/AuthContext.tsx`** -> Mostra o domínio de ciclo de vida do React.
6.  **`frontend/hooks/useTransactions.ts`** -> Mostra a gestão de estado assíncrono.
7.  **`docs/CLAUDE-CODE-GUIDE.md`** -> Explica o fluxo de trabalho.

---

## 4. Perguntas Provocativas para o NotebookLM
(Copie e cole estas perguntas no chat do NotebookLM após carregar os arquivos):

*   "Como a arquitetura do FinFlow demonstra maturidade de um Engenheiro Sênior em relação à escalabilidade?"
*   "Explique como o uso de TanStack Query e Custom Hooks no projeto resolve problemas comuns de sincronização de estado em SPAs."
*   "Analise a estratégia de segurança: como o sistema protege as senhas dos usuários e evita ataques comuns na web?"
*   "Dada a descrição da vaga na Plank, quais pontos deste projeto o Paul deve destacar na entrevista técnica?"

---

## 5. Resumo da Stack para Conversa de Café
*   **Frontend:** Next.js 15, React 19, Tailwind CSS, TanStack Query, Recharts, React Hook Form, Zod.
*   **Backend:** Node.js, Express, Prisma, JWT, Bcrypt.
*   **Infra:** Docker Compose (Postgres 16), Neon (Cloud DB), Render/Vercel (Deploy).
