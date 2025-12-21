# Script para Configurar Impressora Diebold para Modo RAW
# Execute como Administrador

Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Configuração Impressora Diebold para Modo RAW  " -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$printerName = "DIABO"

# 1. Verificar se impressora existe
Write-Host "🔍 Verificando impressora '$printerName'..." -ForegroundColor Yellow
$printer = Get-Printer -Name $printerName -ErrorAction SilentlyContinue

if (-not $printer) {
    Write-Host "❌ Impressora '$printerName' não encontrada!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Impressoras disponíveis:" -ForegroundColor Yellow
    Get-Printer | Format-Table Name, DriverName, PortName
    exit 1
}

Write-Host "✅ Impressora encontrada!" -ForegroundColor Green
Write-Host "   Driver: $($printer.DriverName)" -ForegroundColor Gray
Write-Host "   Porta: $($printer.PortName)" -ForegroundColor Gray
Write-Host ""

# 2. Configurar para imprimir diretamente (bypass spooler)
Write-Host "🔧 Configurando para 'Imprimir Diretamente'..." -ForegroundColor Yellow

try {
    # Usa CIM para configurar
    $printerCim = Get-CimInstance -ClassName Win32_Printer -Filter "Name='$printerName'"
    
    if ($printerCim) {
        # Tenta configurar Direct Printing
        $printerCim.Direct = $true
        Set-CimInstance -InputObject $printerCim
        Write-Host "✅ Configuração 'Imprimir Diretamente' ativada!" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ Não foi possível configurar via CIM (requer configuração manual)" -ForegroundColor Yellow
}

Write-Host ""

# 3. Verificar configuração do print processor
Write-Host "🔍 Verificando Print Processor..." -ForegroundColor Yellow

$regPath = "HKLM:\SYSTEM\CurrentControlSet\Control\Print\Printers\$printerName\PrintProcessor"
if (Test-Path $regPath) {
    $printProcessor = Get-ItemProperty -Path $regPath -ErrorAction SilentlyContinue
    Write-Host "   Print Processor: $($printProcessor.Default)" -ForegroundColor Gray
} else {
    Write-Host "   ⚠️ Configuração não encontrada no registro" -ForegroundColor Yellow
}

Write-Host ""

# 4. Reiniciar spooler
Write-Host "🔄 Reiniciando Spooler do Windows..." -ForegroundColor Yellow

try {
    Stop-Service -Name Spooler -Force -ErrorAction Stop
    Write-Host "   ⏸️ Spooler parado" -ForegroundColor Gray
    Start-Sleep -Seconds 2
    Start-Service -Name Spooler -ErrorAction Stop
    Write-Host "   ▶️ Spooler iniciado" -ForegroundColor Gray
    Write-Host "✅ Spooler reiniciado com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao reiniciar spooler: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Execute manualmente:" -ForegroundColor Yellow
    Write-Host "   net stop spooler" -ForegroundColor Cyan
    Write-Host "   net start spooler" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  PRÓXIMOS PASSOS - CONFIGURAÇÃO MANUAL          " -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Se o problema persistir, configure manualmente:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Abra: Painel de Controle → Dispositivos e Impressoras" -ForegroundColor White
Write-Host "2. Botão direito em 'DIABO' → 'Propriedades da Impressora'" -ForegroundColor White
Write-Host "3. Aba 'Avançado':" -ForegroundColor White
Write-Host "   ✓ Marque: 'Imprimir diretamente na impressora'" -ForegroundColor Green
Write-Host "   ✓ Desmarque: 'Usar spooler para que o programa termine mais rápido'" -ForegroundColor Green
Write-Host "4. Clique em 'Padrões de Impressão...' ou 'Opções de Impressão...'" -ForegroundColor White
Write-Host "5. Procure por:" -ForegroundColor White
Write-Host "   - Modo RAW ou Modo de Emulação → ESC/POS" -ForegroundColor Gray
Write-Host "   - Tipo de Dados → RAW (não EMF ou TEXT)" -ForegroundColor Gray
Write-Host "6. Clique OK em todas as janelas" -ForegroundColor White
Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  TESTE ALTERNATIVO - Impressão Direta sem Driver" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Execute este comando para testar impressão direta:" -ForegroundColor Yellow
Write-Host ""
Write-Host 'echo "TESTE DIEBOLD" > $env:TEMP\teste.txt' -ForegroundColor Cyan
Write-Host 'cmd /c "type $env:TEMP\teste.txt > \\.\DIABO"' -ForegroundColor Cyan
Write-Host ""
Write-Host "Se isso imprimir, o driver está bloqueando dados RAW." -ForegroundColor Gray
Write-Host ""
