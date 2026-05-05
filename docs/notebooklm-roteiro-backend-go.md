# Prompt de Direcionamento para o NotebookLM: Podcast Backend & Banco de Dados

**Objetivo:** Instruir o NotebookLM a gerar um episódio de podcast ("Deep Dive") focado exclusivamente na estrutura do banco de dados, na conexão com os backends (Express e Go) e na arquitetura Go, usando uma linguagem extremamente didática, voltada para um desenvolvedor Frontend.

---

**COPIE E COLE O TEXTO ABAIXO NO CHAT DO NOTEBOOKLM (APÓS CARREGAR OS ARQUIVOS DO PROJETO):**

---

"Gere um episódio de podcast longo, dinâmico e muito didático entre dois apresentadores (um host curioso e um especialista técnico). O ouvinte principal é o Paul, um Desenvolvedor Frontend que está mergulhando no Fullstack e quer entender tudo nos mínimos detalhes. Expliquem como se estivessem ensinando a uma criança ou à vovozinha dele, usando metáforas do mundo real (como restaurantes, caixas organizadoras, etc).

**Abordem detalhadamente os seguintes tópicos, nesta ordem:**

1. **O Nascimento do Banco de Dados (A Fundação da Casa):**
   - Expliquem o passo a passo de como o banco de dados do FinFlow foi criado. 
   - Falem sobre o PostgreSQL: por que usar ele? O que significa ele ser 'relacional'? (Usem a metáfora de planilhas do Excel que conversam entre si).
   - Expliquem as tabelas principais (User, Transaction, Category) e como elas se conectam (chaves estrangeiras = crachás de identificação).

2. **O Prisma e as Migrations (O Arquiteto Mágico):**
   - Como o backend Express usa o Prisma para falar com o banco?
   - O que são 'Migrations'? (Metáfora: O diário de obras que anota toda parede nova ou janela que foi quebrada na casa para nunca perder o histórico).
   - Falem sobre o comando de 'seed': o que é popular o banco com dados falsos para testar?

3. **Dois Restaurantes, Uma Só Cozinha (Express vs. Golang):**
   - Expliquem que o FinFlow tem duas opções de backend que apontam para o mesmo banco de dados PostgreSQL.
   - **Express (Node.js):** Como ele se conecta ao Prisma. Expliquem que ele é como um chef muito rápido e flexível (JavaScript), mas que trabalha sozinho (Single Thread).
   - **Golang (backgo):** Como o Go usa o GORM em vez do Prisma. Expliquem o conceito de *AutoMigrate* no Go (ele olha as Structs e cria as tabelas).
   - Comparem os dois! Usem a analogia: O Node é um garçom rápido de patins equilibrando mil pratos (Event Loop). O Go é um exército de formiguinhas trabalhadoras onde cada uma faz uma tarefa sem atrapalhar a outra (Goroutines).

4. **A Arquitetura Limpa no Go (Organizando as Gavetas):**
   - Façam um 'Tour' pelas pastas do Go (com base no arquivo ARCHITECTURE_GO.md).
   - Expliquem para que serve a pasta `internal/models` (O que são Structs? Como elas são diferentes de Types/Interfaces no TypeScript?).
   - Expliquem a pasta `internal/repository` (A porta de acesso ao banco) e por que isolar isso é uma atitude de Desenvolvedor Sênior.
   - Expliquem a pasta `internal/handlers` (Os garçons que pegam o pedido do frontend).

5. **Dicas para o Paul (Frontend indo pro Backend):**
   - O que o Paul, como dev Frontend (React/Next.js), vai achar mais fácil no Go? O que vai ser mais estranho?
   - Discutam como a tipagem estrita do Go traz paz de espírito na hora de colocar o app no ar.

**Tom da Conversa:** Empolgado, cheio de energia, usando analogias de restaurante, construção de casas e cozinha. Façam piadas leves sobre o 'caos' do JavaScript em comparação com as regras rígidas do Go. Certifiquem-se de que cada conceito técnico novo (como GORM, Goroutine, JWT, Migrations) seja traduzido para algo do cotidiano."
