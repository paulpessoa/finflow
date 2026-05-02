# FinFlow API — Guia de Testes (Postman/Insomnia/cURL)

Este guia contém os endpoints principais e scripts para facilitar o teste da API localmente.

## 🚀 Configuração do Ambiente no Postman

Para não precisar copiar e colar o token toda vez, crie um **Environment** no Postman chamado `finflow_environment` com a variável:
- `baseUrl`: `http://localhost:3001`
- `token`: (deixe vazio, o script vai preencher)

---

## 🔐 Autenticação

### Login (Obter Token)
- **Método:** `POST`
- **URL:** `{{baseUrl}}/api/auth/login`
- **Body (JSON):**
  ```json
  {
    "email": "paul@demo.com",
    "password": "demo1234"
  }
  ```

**Scripts -> Post-response (no Postman):**
Copie e cole isso na aba "Scripts" (ou "Tests" em versões antigas) para salvar o token automaticamente:
```javascript
const response = pm.response.json();
if (response.token) {
    pm.environment.set("token", response.token);
    console.log("✅ Token salvo no ambiente!");
}
```

---

## 💰 Transações (CRUD)

### 1. Criar Transação (CREATE)
- **Método:** `POST`
- **URL:** `{{baseUrl}}/api/transactions`
- **Auth:** Bearer Token -> `{{token}}`
- **Body (JSON):**
  ```json
  {
    "description": "Freelance Projeto X",
    "amount": 2500,
    "type": "INCOME",
    "date": "2026-05-01T10:00:00Z",
    "categoryId": "ID_DA_CATEGORIA"
  }
  ```

### 2. Listar Todas (READ)
- **Método:** `GET`
- **URL:** `{{baseUrl}}/api/transactions`
- **Auth:** Bearer Token -> `{{token}}`

### 3. Resumo/Dashboard (Summary)
- **Método:** `GET`
- **URL:** `{{baseUrl}}/api/transactions/summary`
- **Auth:** Bearer Token -> `{{token}}`

### 4. Deletar Transação (DELETE)
- **Método:** `DELETE`
- **URL:** `{{baseUrl}}/api/transactions/ID_DA_TRANSACAO`
- **Auth:** Bearer Token -> `{{token}}`

---

## 🏷️ Categorias

### Listar Categorias
Use este endpoint para pegar os IDs necessários para criar transações.
- **Método:** `GET`
- **URL:** `{{baseUrl}}/api/categories`
- **Auth:** Bearer Token -> `{{token}}`
