@echo off
REM Script de build do Electron para Windows
REM Builda o Angular primeiro, depois o Electron

echo 🔨 Iniciando build do Experimenta aí do Soneca...

REM Encerra processos do Electron que possam estar rodando
echo 🔍 Verificando processos do Electron...
taskkill /F /IM "Experimenta aí do Soneca.exe" 2>nul
taskkill /F /IM electron.exe 2>nul
timeout /t 1 /nobreak >nul

REM Navega para a pasta do frontend
cd /d "%~dp0.."

echo 📦 Buildando Angular...
call npm run build

if %errorlevel% neq 0 (
    echo ❌ Erro ao buildar Angular. Abortando.
    exit /b 1
)

echo ✅ Angular buildado com sucesso!

REM Navega para pasta do Electron
cd electron

echo 🔨 Buildando Electron...
call npm run build:win

if %errorlevel% neq 0 (
    echo ❌ Erro ao buildar Electron. Abortando.
    exit /b 1
)

echo ✅ Build concluído com sucesso!
echo 📁 Executável disponível em: electron\dist\
pause

