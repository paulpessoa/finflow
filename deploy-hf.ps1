# Script de Automação de Deploy para o Hugging Face Spaces
# Executar a partir da raiz do monorepo finflow

Write-Host "🔄 Sincronizando arquivos do backpy para finflow-python..." -ForegroundColor Cyan

# Copiar os arquivos
Copy-Item -Path "backpy/app/*" -Destination "finflow-python/app/" -Recurse -Force
Copy-Item -Path "backpy/requirements.txt" -Destination "finflow-python/requirements.txt" -Force

Write-Host "📦 Alterando diretório para finflow-python..." -ForegroundColor Cyan
cd finflow-python

# Commit e Push
Write-Host "📤 Preparando commit no Git..." -ForegroundColor Cyan
git add .
git commit -m "update: fix passlib bcrypt compatibility bug"

Write-Host "🚀 Enviando atualizações para o Hugging Face Spaces..." -ForegroundColor Cyan
git push origin main

Write-Host "↩️ Retornando à raiz do projeto..." -ForegroundColor Cyan
cd ..

Write-Host "✅ Deploy concluído com sucesso!" -ForegroundColor Green
