#!/bin/bash

# Script de build do Electron
# Builda o Angular primeiro, depois o Electron

echo "🔨 Iniciando build do Experimenta aí do Soneca..."

# Navega para a pasta do frontend
cd "$(dirname "$0")/.." || exit

echo "📦 Buildando Angular..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erro ao buildar Angular. Abortando."
    exit 1
fi

echo "✅ Angular buildado com sucesso!"

# Navega para pasta do Electron
cd electron || exit

echo "🔨 Buildando Electron..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erro ao buildar Electron. Abortando."
    exit 1
fi

echo "✅ Build concluído com sucesso!"
echo "📁 Executável disponível em: electron/dist/"

