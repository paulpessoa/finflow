# FinFlow - HTMX Frontend

Esta é uma implementação alternativa do frontend do FinFlow utilizando **HTMX** e **Express**. 

## 🚀 Como Executar Localmente

### 1. Pré-requisitos
Certifique-se de que o backend principal do FinFlow esteja rodando (geralmente na porta `3001`).

### 2. Instalação
Entre na pasta `htmx` e instale as dependências:
```bash
cd htmx
npm install
```

### 3. Execução
Inicie o servidor de desenvolvimento:
```bash
npm start
```
O frontend estará disponível em: `http://localhost:4000`

## ☁️ Deploy

### Render / Railway
Para fazer o deploy desta versão, você pode hospedar a pasta `htmx` como um serviço separado do tipo "Web Service".

1. **Root Directory**: `htmx`
2. **Build Command**: `npm install`
3. **Start Command**: `node index.js`
4. **Variáveis de Ambiente**:
   - `API_URL`: URL da sua API Node.js (ex: `https://finflow-api.onrender.com/api`)
   - `HTMX_PORT`: `4000` (ou a porta padrão do serviço)

## 🛠️ Tecnologias Utilizadas
- **HTMX**: Para interações dinâmicas sem JavaScript complexo no cliente.
- **Express**: Servidor web para renderização de templates.
- **EJS**: Engine de templates para fragmentos HTML dinâmicos.
- **Axios**: Para comunicação com a API backend existente.
