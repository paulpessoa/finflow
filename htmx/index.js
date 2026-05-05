require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.HTMX_PORT || 4000;
// Note: Removido o /api se a chamada já inclui no endpoint
const API_BASE = process.env.API_URL || 'http://localhost:3001/api';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para verificar se está logado
const checkAuth = (req, res, next) => {
    const token = req.cookies.token;
    if (!token && req.path !== '/login' && req.path !== '/register') {
        return res.redirect('/login');
    }
    next();
};

// Rotas de View
app.get('/', checkAuth, (req, res) => {
    let userData = { name: 'Usuário' };
    try {
        if (req.cookies.user) {
            userData = typeof req.cookies.user === 'string' ? JSON.parse(req.cookies.user) : req.cookies.user;
        }
    } catch (e) {}
    res.render('dashboard', { user: userData });
});

app.get('/transactions', checkAuth, (req, res) => {
    let userData = { name: 'Usuário' };
    try {
        if (req.cookies.user) {
            userData = typeof req.cookies.user === 'string' ? JSON.parse(req.cookies.user) : req.cookies.user;
        }
    } catch (e) {}
    res.render('transactions', { user: userData });
});

app.get('/login', (req, res) => {
    if (req.cookies.token) return res.redirect('/');
    res.render('login');
});

app.get('/register', (req, res) => {
    if (req.cookies.token) return res.redirect('/');
    res.render('register');
});


// Ações HTMX - Auth
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const response = await axios.post(`${API_BASE}/auth/login`, { email, password });
        const { token, user } = response.data;

        res.cookie('token', token, { httpOnly: true });
        res.cookie('user', JSON.stringify(user));

        res.set('HX-Redirect', '/');
        res.send('Sucesso! Redirecionando...');
    } catch (error) {
        console.error('Login Error:', error.response?.data || error.message);
        const message = error.response?.data?.error || 'Falha ao entrar';
        res.send(`<div class="error-message">${message}</div>`);
    }
});

app.post('/auth/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const response = await axios.post(`${API_BASE}/auth/register`, { name, email, password });
        const { token, user } = response.data;

        res.cookie('token', token, { httpOnly: true });
        res.cookie('user', JSON.stringify(user));

        res.set('HX-Redirect', '/');
        res.send('Cadastro realizado com sucesso! Entrando...');
    } catch (error) {
        console.error('Register Error:', error.response?.data || error.message);
        const message = error.response?.data?.error || 'Falha ao cadastrar';
        res.send(`<div class="error-message">${message}</div>`);
    }
});


app.get('/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.clearCookie('user');
    res.redirect('/login');
});

// Ações HTMX - Transações
app.get('/transactions/new', checkAuth, (req, res) => {
    res.render('partials/transaction-form', { layout: false, transaction: null });
});

app.get('/transactions/:id/edit', checkAuth, async (req, res) => {
    try {
        const token = req.cookies.token;
        const response = await axios.get(`${API_BASE}/transactions/${req.params.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const transaction = response.data.data || response.data;
        
        if (!transaction) {
            return res.status(404).send('Transação não encontrada');
        }

        res.render('partials/transaction-form', { 
            layout: false, 
            transaction: transaction 
        });
    } catch (error) {
        console.error('Erro ao buscar transação para edição:', error.response?.data || error.message);
        res.status(500).send('Erro ao carregar dados para edição');
    }
});

app.post('/transactions/:id', checkAuth, async (req, res) => {
    try {
        const token = req.cookies.token;
        const data = {
            ...req.body,
            amount: Number(req.body.amount),
            date: new Date(req.body.date).toISOString()
        };

        await axios.put(`${API_BASE}/transactions/${req.params.id}`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });

        res.set('HX-Trigger', 'transactionUpdated');
        res.send(`
            <div style="color: #10b981; margin-bottom: 1rem;">Atualizado com sucesso!</div>
            <script>
                setTimeout(() => {
                    const modal = document.getElementById('modal-overlay');
                    if (modal) modal.remove();
                }, 2000);
            </script>
        `);
    } catch (error) {
        res.send(`<div class="error-message">Erro ao atualizar</div>`);
    }
});

app.delete('/transactions/:id', checkAuth, async (req, res) => {
    try {
        const token = req.cookies.token;
        await axios.delete(`${API_BASE}/transactions/${req.params.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        // Dispara evento para atualizar o resumo também
        res.set('HX-Trigger', 'transactionUpdated');
        res.send(''); // Retorna vazio para o HTMX remover o elemento
    } catch (error) {
        res.status(500).send('Erro');
    }
});

app.get('/transactions/summary', checkAuth, async (req, res) => {
    try {
        const token = req.cookies.token;
        const response = await axios.get(`${API_BASE}/transactions/summary`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        res.render('partials/summary-cards', { 
            summary: response.data,
            layout: false 
        });
    } catch (error) {
        res.send('<div class="error-message">Erro no resumo</div>');
    }
});

app.get('/transactions/table', checkAuth, async (req, res) => {
    try {
        const token = req.cookies.token;
        console.log(`Buscando transações em: ${API_BASE}/transactions`);
        
        const response = await axios.get(`${API_BASE}/transactions`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        // A API retorna { data: [...] }
        const transactions = response.data.data || [];

        res.render('partials/transactions-table', { 
            transactions: transactions,
            layout: false 
        });
    } catch (error) {
        console.error('Erro ao buscar transações:', error.response?.status, error.response?.data || error.message);
        res.status(200).send('<div class="error-message">Erro ao carregar transações da API principal. Verifique o console.</div>');
    }
});

// Ações HTMX - Categorias
app.get('/api-proxy/categories', checkAuth, async (req, res) => {
    try {
        const token = req.cookies.token;
        const response = await axios.get(`${API_BASE}/categories`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const categories = response.data.data || (Array.isArray(response.data) ? response.data : []);
        let html = categories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
        if (html === '') html = '<option disabled>Nenhuma categoria</option>';
        res.send(html);
    } catch (error) {
        res.send('<option disabled>Erro ao carregar</option>');
    }
});

// Ações HTMX - Gráficos
app.get('/dashboard/chart-data', checkAuth, async (req, res) => {
    try {
        const token = req.cookies.token;
        const response = await axios.get(`${API_BASE}/transactions`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const transactions = response.data.data || response.data || [];
        const totals = transactions.reduce((acc, t) => {
            if (t.type === 'INCOME') {
                acc.income += t.amount;
            } else {
                acc.expense += t.amount;
                const cat = t.category || { name: 'Outros', icon: '📁', color: '#94a3b8' };
                if (!acc.byCategory[cat.name]) {
                    acc.byCategory[cat.name] = {
                        name: cat.name,
                        icon: cat.icon,
                        color: cat.color,
                        total: 0
                    };
                }
                acc.byCategory[cat.name].total += t.amount;
            }
            return acc;
        }, { income: 0, expense: 0, byCategory: {} });
        
        // Transformar objeto em array para facilitar no EJS
        totals.categoryList = Object.values(totals.byCategory).sort((a, b) => b.total - a.total);
        
        res.json(totals);


    } catch (error) {
        res.status(500).json({ error: 'Erro ao carregar dados' });
    }
});

app.get('/dashboard/chart', checkAuth, (req, res) => {
    res.render('partials/dashboard-chart', { layout: false });
});

// Ações HTMX - IA Insights
app.get('/dashboard/ai-insights', checkAuth, (req, res) => {
    res.render('partials/ai-insights', { layout: false, insights: null });
});

app.post('/api-proxy/ai/insights', checkAuth, async (req, res) => {
    try {
        const token = req.cookies.token;
        const response = await axios.post(`${API_BASE}/ai/insights`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        res.render('partials/ai-insights', { 
            layout: false, 
            insights: response.data 
        });
    } catch (error) {
        const message = error.response?.data?.error || 'Erro na análise';
        res.send(`<div class="error-message">${message}</div>`);
    }
});

// Ações HTMX - IA Chat (Streaming)
app.post('/api-proxy/ai/chat', checkAuth, async (req, res) => {
    const { question } = req.body;
    const token = req.cookies.token;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    try {
        const response = await axios({
            method: 'post',
            url: `${API_BASE}/streaming/ask`,
            data: { question },
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'stream'
        });

        response.data.on('data', (chunk) => {
            res.write(chunk);
        });

        response.data.on('end', () => {
            res.end();
        });

    } catch (error) {
        console.error('Erro no stream IA:', error.message);
        res.write('Erro ao processar sua pergunta.');
        res.end();
    }
});

// Ações HTMX - Criar Transação
app.post('/transactions', checkAuth, async (req, res) => {
    try {
        const token = req.cookies.token;
        const data = {
            ...req.body,
            amount: Number(req.body.amount),
            date: new Date(req.body.date).toISOString()
        };

        await axios.post(`${API_BASE}/transactions`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });

        res.set('HX-Trigger', 'transactionUpdated');
        res.send(`
            <div style="color: #10b981; margin-bottom: 1rem;">Transação criada com sucesso!</div>
            <script>
                setTimeout(() => {
                    const modal = document.getElementById('modal-overlay');
                    if (modal) modal.remove();
                }, 2000);
            </script>
        `);
    } catch (error) {
        console.error('Erro ao criar:', error.response?.data || error.message);
        const message = error.response?.data?.error || 'Erro ao salvar';
        res.send(`<div class="error-message">${message}</div>`);
    }
});

app.listen(PORT, () => {
    console.log(`HTMX Frontend rodando em http://localhost:${PORT}`);
    console.log(`Conectado à API em: ${API_BASE}`);
});
