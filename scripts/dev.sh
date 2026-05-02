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
