# Script para verificar status detalhado do backend
# Execute: .\verificar-backend.ps1

Write-Host "=== Verificando Status dos Containers ===" -ForegroundColor Cyan
docker-compose -f docker-compose.dev.yml ps

Write-Host "`n=== Verificando Logs do Backend (últimas 50 linhas) ===" -ForegroundColor Cyan
docker-compose -f docker-compose.dev.yml logs --tail=50 backend-dev

Write-Host "`n=== Verificando se o Backend está escutando na porta 8080 ===" -ForegroundColor Cyan
$portCheck = netstat -ano | findstr "8080"
if ($portCheck) {
    Write-Host "✅ Porta 8080 está em uso:" -ForegroundColor Green
    Write-Host $portCheck -ForegroundColor Gray
} else {
    Write-Host "❌ Porta 8080 não está em uso" -ForegroundColor Red
}

Write-Host "`n=== Testando Conexão HTTP ===" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080" -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Backend está respondendo (Status: $($response.StatusCode))" -ForegroundColor Green
    Write-Host "Content-Type: $($response.Headers['Content-Type'])" -ForegroundColor Gray
} catch {
    Write-Host "❌ Backend não está respondendo" -ForegroundColor Red
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
    
    Write-Host "`n=== Verificando se o Spring Boot terminou de inicializar ===" -ForegroundColor Yellow
    $logs = docker-compose -f docker-compose.dev.yml logs backend-dev | Select-String "Started SnackBarApplication\|BUILD SUCCESS\|BUILD FAILURE" -CaseSensitive:$false
    if ($logs) {
        Write-Host "Últimas linhas relevantes:" -ForegroundColor Yellow
        $logs | Select-Object -Last 5 | ForEach-Object { Write-Host $_ -ForegroundColor Gray }
    } else {
        Write-Host "⚠️ Não encontrou mensagem de inicialização do Spring Boot" -ForegroundColor Yellow
    }
}

Write-Host "`n=== Verificando se o usuário admin foi criado ===" -ForegroundColor Cyan

# Carregar senha do banco de variável de ambiente
$dbPassword = $env:DB_PASSWORD
if (-not $dbPassword) {
    Write-Host "⚠️ Variável DB_PASSWORD não definida. Pulando verificação do banco." -ForegroundColor Yellow
    Write-Host "   Para habilitar, defina: `$env:DB_PASSWORD = 'sua-senha'" -ForegroundColor Gray
} else {
    try {
        $mysqlCmd = "SELECT COUNT(*) as total FROM usuarios WHERE email = 'admin@snackbar.com';"
        $result = docker exec experimentaai-delivery-mysql-dev mysql -u soneca_delivery_user -p$dbPassword experimentaai_delivery -e $mysqlCmd 2>&1
    
        if ($result -match "total\s+(\d+)") {
            $count = $matches[1]
            if ($count -eq "1") {
                Write-Host "✅ Usuário admin existe no banco" -ForegroundColor Green
            } else {
                Write-Host "❌ Usuário admin NÃO existe no banco (encontrados: $count)" -ForegroundColor Red
            }
        } else {
            Write-Host "⚠️ Não foi possível verificar o banco. Resultado:" -ForegroundColor Yellow
            Write-Host $result -ForegroundColor Gray
        }
    } catch {
        Write-Host "❌ Erro ao verificar banco: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n=== Verificando Logs de Criação do Usuário Admin ===" -ForegroundColor Cyan
$adminLogs = docker-compose -f docker-compose.dev.yml logs backend-dev | Select-String "admin\|usuário\|usuario\|UsuarioInicialConfig" -CaseSensitive:$false
if ($adminLogs) {
    Write-Host "Logs encontrados:" -ForegroundColor Green
    $adminLogs | Select-Object -Last 10 | ForEach-Object { Write-Host $_ -ForegroundColor Gray }
} else {
    Write-Host "⚠️ Nenhum log sobre criação de usuário admin encontrado" -ForegroundColor Yellow
}
