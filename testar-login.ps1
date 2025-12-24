# Script para testar login e verificar usuário admin
# Execute: .\testar-login.ps1
#
# Variáveis de ambiente necessárias (ou defina antes de executar):
#   $env:TEST_EMAIL = "admin@snackbar.com"
#   $env:TEST_SENHA = "sua-senha-aqui"
#   $env:DB_PASSWORD = "senha-do-banco" (opcional, para comandos de exemplo)

Write-Host "=== Testando Login ===" -ForegroundColor Cyan

# Carregar variáveis de ambiente (com valores padrão para desenvolvimento local)
$testEmail = $env:TEST_EMAIL
$testSenha = $env:TEST_SENHA

# Se não estiverem definidas, solicitar ao usuário
if (-not $testEmail) {
    $testEmail = Read-Host "Digite o email do usuário (ou defina TEST_EMAIL)"
}

if (-not $testSenha) {
    $testSenha = Read-Host "Digite a senha (ou defina TEST_SENHA)" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($testSenha)
    $testSenha = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

$loginUrl = "http://localhost:8080/api/auth/login"
$body = @{
    emailOuUsuario = $testEmail
    senha          = $testSenha
} | ConvertTo-Json

Write-Host "`nEnviando requisição para: $loginUrl" -ForegroundColor Yellow
Write-Host "Email: $testEmail" -ForegroundColor Yellow
Write-Host "Senha: [OCULTA]" -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri $loginUrl `
        -Method Post `
        -ContentType "application/json" `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host "`n✅ Login realizado com sucesso!" -ForegroundColor Green
    Write-Host "`nToken (primeiros 50 caracteres): $($response.token.Substring(0, [Math]::Min(50, $response.token.Length)))..." -ForegroundColor Green
    Write-Host "`nUsuário:" -ForegroundColor Green
    Write-Host "  - ID: $($response.usuario.id)" -ForegroundColor Green
    Write-Host "  - Nome: $($response.usuario.nome)" -ForegroundColor Green
    Write-Host "  - Email: $($response.usuario.email)" -ForegroundColor Green
    Write-Host "  - Role: $($response.usuario.role)" -ForegroundColor Green
    Write-Host "  - Ativo: $($response.usuario.ativo)" -ForegroundColor Green
    
}
catch {
    Write-Host "`n❌ Erro ao fazer login!" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Status Code: $statusCode" -ForegroundColor Red
        
        try {
            $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
            Write-Host "Mensagem: $($errorBody.message)" -ForegroundColor Red
        }
        catch {
            Write-Host "Resposta: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    else {
        Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host "`n💡 Verificações:" -ForegroundColor Yellow
    Write-Host "1. Verifique se o backend está rodando:" -ForegroundColor Yellow
    Write-Host "   docker-compose -f docker-compose.dev.yml ps" -ForegroundColor Gray
    Write-Host "`n2. Verifique os logs do backend:" -ForegroundColor Yellow
    Write-Host "   docker-compose -f docker-compose.dev.yml logs backend-dev | Select-String 'admin'" -ForegroundColor Gray
    Write-Host "`n3. Verifique se o usuário foi criado no banco:" -ForegroundColor Yellow
    $dbPassword = $env:DB_PASSWORD
    if ($dbPassword) {
        Write-Host "   docker exec -it experimentaai-delivery-mysql-dev mysql -u soneca_delivery_user -p$dbPassword experimentaai_delivery -e 'SELECT * FROM usuarios WHERE email = \"$testEmail\";'" -ForegroundColor Gray
    }
    else {
        Write-Host "   docker exec -it experimentaai-delivery-mysql-dev mysql -u soneca_delivery_user -p[SUA_SENHA] experimentaai_delivery -e 'SELECT * FROM usuarios WHERE email = \"$testEmail\";'" -ForegroundColor Gray
        Write-Host "   (Defina DB_PASSWORD como variável de ambiente ou substitua [SUA_SENHA])" -ForegroundColor Gray
    }
}

Write-Host "`n=== Verificando Backend ===" -ForegroundColor Cyan

try {
    $healthCheck = Invoke-WebRequest -Uri "http://localhost:8080" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Backend está respondendo (Status: $($healthCheck.StatusCode))" -ForegroundColor Green
}
catch {
    Write-Host "❌ Backend não está respondendo" -ForegroundColor Red
    Write-Host "   Verifique se o container está rodando:" -ForegroundColor Yellow
    Write-Host "   docker-compose -f docker-compose.dev.yml ps" -ForegroundColor Gray
}

Write-Host "`n=== Verificando Containers ===" -ForegroundColor Cyan

$containers = docker-compose -f docker-compose.dev.yml ps --format json | ConvertFrom-Json

foreach ($container in $containers) {
    $status = if ($container.State -eq "running") { "✅" } else { "❌" }
    Write-Host "$status $($container.Service): $($container.State)" -ForegroundColor $(if ($container.State -eq "running") { "Green" } else { "Red" })
}
