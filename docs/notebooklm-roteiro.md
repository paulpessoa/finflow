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

### J. Tipagem de Elite: Entidades vs. DTOs
*   **Decisão:** Uso de tipos compartilhados em `@shared/types` para as entidades, mas tipos específicos para formulários no Frontend.
*   **Justificativa Sênior:** 
    *   **Entidades:** Refletem a estrutura fiel do banco de dados (Prisma).
    *   **DTOs/Form Data:** Refletem a necessidade da interface. Um formulário de criação não possui `id` ou `timestamps`, e lida com a conversão de `strings` do DOM para `numbers` do sistema. Essa separação evita o vazamento de lógica de banco para a UI.

### K. Acessibilidade e Semântica HTML
*   **Decisão:** Uso rigoroso de `htmlFor` em labels e atributos semânticos em inputs.
*   **Justificativa Sênior:** 
    *   Acessibilidade não é opcional. Vincular labels corretamente melhora a experiência de usuários que utilizam leitores de tela. 
    *   Evitar atributos inválidos (como `name` em labels) garante que o navegador renderize o código da forma mais otimizada possível, conforme as especificações da W3C.

### L. Arquitetura de Sessão: Injeção via SSR
*   **Decisão:** O servidor lê os Cookies no `layout.tsx` e injeta o usuário no `AuthContext` via props.
*   **Justificativa Sênior:** 
    *   Isso elimina o erro de Hidratação (Hydration Mismatch) e o efeito de "piscada" (Flicker) na interface. O usuário recebe o HTML já com seu nome e perfil carregados, resultando em uma Performance Percebida (FCP - First Contentful Paint) muito superior ao uso de `localStorage`.

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
