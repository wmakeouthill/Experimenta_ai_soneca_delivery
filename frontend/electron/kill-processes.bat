@echo off
REM Script para encerrar processos do Electron antes do build
REM Evita erro "Access is denied" ao tentar fazer build

echo 🔍 Encerrando processos do Electron...

REM Encerra processos "Experimenta aí do Soneca.exe"
taskkill /F /IM "Experimenta aí do Soneca.exe" 2>nul
if %errorlevel% == 0 (
    echo ✅ Processo "Experimenta aí do Soneca.exe" encerrado
) else (
    echo ℹ️  Nenhum processo "Experimenta aí do Soneca.exe" encontrado
)

REM Encerra processos electron.exe (caso algum esteja rodando)
taskkill /F /IM electron.exe 2>nul
if %errorlevel% == 0 (
    echo ✅ Processo electron.exe encerrado
) else (
    echo ℹ️  Nenhum processo electron.exe encontrado
)

REM Aguarda um pouco para garantir que os processos foram encerrados
timeout /t 1 /nobreak >nul

echo ✅ Limpeza concluída. Pode fazer o build agora.

