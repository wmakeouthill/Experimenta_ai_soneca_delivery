#!/bin/bash
set -e

echo "🚀 Iniciando frontend em modo desenvolvimento..."

# Garantir que estamos no diretório correto
cd /app/frontend

# Verificar se node_modules existe e tem conteúdo básico
if [ ! -d "node_modules" ] || [ ! -d "node_modules/@angular" ]; then
    echo "📦 Instalando dependências do npm..."
    npm install --legacy-peer-deps
else
    echo "✅ Dependências já instaladas"
fi

echo "🔥 Iniciando Angular Dev Server com hot-reload..."
echo "🌐 Frontend disponível em: http://localhost:4200"
echo "📝 Mudanças serão refletidas automaticamente no navegador"

# ========== OTIMIZAÇÕES DE PERFORMANCE ==========
# Aumenta buffer de memória do Node.js
export NODE_OPTIONS="--max-old-space-size=4096"

# ⚠️ WINDOWS + DOCKER: Polling é OBRIGATÓRIO!
# Eventos de filesystem do Windows não propagam para containers Linux
export CHOKIDAR_USEPOLLING=true
export WATCHPACK_POLLING=true

# Executar ng serve COM polling para Windows
exec npm start
