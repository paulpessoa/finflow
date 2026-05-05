# Arquitetura do Backend em Go (Para Desenvolvedores Frontend)

Seja bem-vindo ao lado Go da força! Se você vem do mundo JavaScript/TypeScript (Node.js, Express, NestJS), o Go pode parecer um pouco diferente no início, mas ele é incrivelmente previsível e seguro.

Este documento explica como organizamos o projeto `backgo` usando conceitos de **Clean Architecture** (Arquitetura Limpa), de uma forma simples e didática.

---

## 1. Por que Go? (Go vs Node/Express)

Imagine que o **Node.js** é um chef de cozinha super ágil que cozinha sozinho (Single Thread). Ele é rápido porque sabe delegar tarefas (Event Loop), mas se tiver que fatiar uma melancia inteira (tarefa pesada de CPU), o restaurante todo para até ele terminar.

O **Go** é uma cozinha industrial cheia de chefs (Goroutines). Se um chef está cortando a melancia, os outros continuam cozinhando normalmente. 

Além disso, o Go é **fortemente tipado** de verdade. No TypeScript, você pode enganar o compilador com um `as any`. No Go, se uma variável é um texto, ela *é* um texto e não vai mudar de ideia em tempo de execução. Isso nos dá uma segurança gigante em produção.

---

## 2. A Estrutura de Pastas (O "Clean Architecture" Simplificado)

Nós dividimos as responsabilidades em pastas para que o código não vire um "macarrão". Cada pasta tem uma única função.

### `cmd/api/main.go` (O Ponto de Partida)
É o equivalente ao seu `app.ts` ou `index.ts`. 
*   **O que ele faz:** Ele lê as variáveis de ambiente (`.env`), conecta no banco de dados, cria as rotas (URLs) e "liga" o servidor.
*   **Analogia:** É o gerente do restaurante abrindo as portas, ligando a luz e organizando as mesas antes dos clientes chegarem.

### `internal/models/` (As Entidades)
É o equivalente ao seu `schema.prisma`.
*   **O que ele faz:** Define como os dados são estruturados. Em Go, chamamos isso de `Structs`. É aqui que dizemos que o `User` tem `ID`, `Name` e `Email`. 
*   **GORM:** Usamos tags como `gorm:"primaryKey"` ao lado dos campos para ensinar ao ORM (nossa ponte com o banco de dados) como criar as tabelas no PostgreSQL.

### `internal/repository/` (Acesso ao Banco de Dados)
É onde a "mágica" do SQL acontece.
*   **O que ele faz:** Ele é a **única** parte do sistema que sabe que o banco de dados existe. Se precisarmos buscar um usuário, criamos uma função aqui (`FindByEmail`).
*   **Por que Sênior?** No Express com Prisma, costumamos fazer `prisma.user.find(...)` direto na rota. Se um dia você quiser trocar o Prisma ou o PostgreSQL por outro banco, terá que reescrever todas as rotas. No Go, usando o padrão *Repository*, você só precisa alterar o código dentro dessa pasta. As rotas nem sabem qual banco de dados estamos usando!

### `internal/handlers/` (Os Controladores / Rotas)
É o equivalente aos arquivos dentro da pasta `routes/` no Express.
*   **O que ele faz:** Ele atende o telefone. Quando uma requisição HTTP chega (ex: `POST /api/transactions`), o *Handler* pega o JSON que o Frontend enviou (o corpo da requisição), valida se está tudo correto e pede para o *Repository* salvar no banco.
*   **Validação:** Ao invés do Zod, usamos tags na struct (ex: `binding:"required,email"`). Se o frontend enviar um email inválido, o Handler barra a requisição automaticamente.

### `internal/middleware/` (Os Seguranças)
*   **O que ele faz:** Ficam "na frente" das rotas. O nosso `RequireAuth` olha o token JWT no cabeçalho da requisição. Se o token for falso, ele bloqueia o acesso antes mesmo de chegar no Handler.

### `pkg/jwtutil/` (Ferramentas Compartilhadas)
*   **O que ele faz:** Código utilitário que não pertence ao núcleo das regras de negócio. Aqui colocamos as funções de criar e ler Tokens JWT.

---

## 3. O Fluxo de uma Requisição (Passo a Passo)

Vamos acompanhar o que acontece quando o Frontend faz um `POST /api/transactions`:

1.  **A Chegada (`main.go`):** O servidor recebe o POST e vê que a rota `/api/transactions` está ligada ao `transactionHandler.Create`.
2.  **O Segurança (`middleware/auth.go`):** Antes de seguir, o middleware verifica o JWT. Tudo certo? Ele extrai o `userId` e anexa na requisição.
3.  **O Atendente (`handlers/transaction_handler.go`):** O método `Create` tenta ler o JSON que o Frontend mandou e transformar em uma Struct Go (`createTransactionRequest`). Se faltar o `amount`, ele devolve um erro 400.
4.  **A Transformação:** O Handler converte a requisição em um Model real do banco (`models.Transaction`).
5.  **O Repositório (`repository/transaction_repository.go`):** O Handler pede ao repositório: "Salva isso no banco para mim?". O Repositório usa o GORM para gerar o comando `INSERT INTO ...` no PostgreSQL.
6.  **A Resposta:** O banco confirma que salvou, o Repositório avisa o Handler, e o Handler devolve o JSON com `status 201 Created` para o Frontend.

---

## 4. O que é o GORM? (Comparado ao Prisma)
O Prisma (no Node) gera o banco a partir de um arquivo `schema.prisma` e cria funções baseadas nele.
O GORM (no Go) olha para as suas *Structs* no código (`models.go`) e cria as tabelas a partir delas usando a funcionalidade de `AutoMigrate`. Ele é mais voltado para o código (Code-First) do que o Prisma.

Com essa arquitetura, você tem um backend performático, extremamente tipado e fácil de testar, perfeito para escalar horizontalmente em produção!
