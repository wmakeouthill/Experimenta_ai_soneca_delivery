# Script PowerShell para build e push da imagem Docker para Google Container Registry
# Uso: .\build-and-push.ps1 [PROJECT_ID] [TAG]

$ErrorActionPreference = "Stop"

Write-Host "Build e Push da Imagem Docker para GCR" -ForegroundColor Green
Write-Host ""

# Verificar se gcloud esta instalado
$gcloudPath = Get-Command gcloud -ErrorAction SilentlyContinue
if (-not $gcloudPath) {
    Write-Host "ERRO: gcloud CLI nao esta instalado. Instale em: https://cloud.google.com/sdk/docs/install" -ForegroundColor Red
    exit 1
}

# Verificar se esta autenticado
Write-Host "Verificando autenticacao..." -ForegroundColor Green
try {
    $authOutput = gcloud auth list --filter="status:ACTIVE" --format="value(account)" 2>&1
    $activeAccount = ($authOutput | Where-Object { $_ -notmatch 'ERROR|WARNING' } | Select-Object -First 1).ToString().Trim()
    
    if ([string]::IsNullOrWhiteSpace($activeAccount)) {
        Write-Host "ERRO: Voce nao esta autenticado neste terminal." -ForegroundColor Red
        Write-Host ""
        Write-Host "Para fazer login, execute:" -ForegroundColor Yellow
        Write-Host "   gcloud auth login" -ForegroundColor Yellow
        Write-Host ""
        exit 1
    } else {
        Write-Host "OK: Autenticado como: $activeAccount" -ForegroundColor Green
    }
} catch {
    Write-Host "ERRO: Nao foi possivel verificar autenticacao" -ForegroundColor Red
    exit 1
}

# Solicitar PROJECT_ID se nao fornecido
if ($args.Count -eq 0) {
    Write-Host "Projetos disponiveis:" -ForegroundColor Yellow
    gcloud projects list --format="table(projectId,name)"
    Write-Host ""
    $PROJECT_ID = Read-Host "Digite o PROJECT_ID"
} else {
    $PROJECT_ID = $args[0]
}

# Definir TAG (default: latest)
$TAG = if ($args.Count -gt 1) { $args[1] } else { "latest" }

# Configurar projeto
Write-Host "Configurando projeto: $PROJECT_ID" -ForegroundColor Green
try {
    $currentProject = (gcloud config get-value project 2>&1).ToString().Trim()
    
    if ($currentProject -ne $PROJECT_ID) {
        Write-Host "   Projeto atual: $(if ($currentProject) { $currentProject } else { 'nenhum' })" -ForegroundColor Yellow
        Write-Host "   Mudando para: $PROJECT_ID" -ForegroundColor Yellow
        gcloud config set project $PROJECT_ID
        if ($LASTEXITCODE -ne 0) {
            Write-Host "ERRO: Nao foi possivel configurar projeto" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "   OK: Projeto ja esta configurado corretamente" -ForegroundColor Green
    }
} catch {
    Write-Host "ERRO: Nao foi possivel verificar/configurar projeto" -ForegroundColor Red
    exit 1
}

# Habilitar Container Registry API se necessario
Write-Host "Verificando APIs necessarias..." -ForegroundColor Green
gcloud services enable containerregistry.googleapis.com --project=$PROJECT_ID

# Configurar Docker para usar gcloud como credencial helper
Write-Host "Configurando credenciais Docker..." -ForegroundColor Green
gcloud auth configure-docker gcr.io --quiet

# Nome da imagem
$IMAGE_NAME = "gcr.io/$PROJECT_ID/soneca-delivery-app:$TAG"
$LATEST_TAG = "gcr.io/$PROJECT_ID/soneca-delivery-app:latest"

# Build da imagem usando Dockerfile.cloud-run
Write-Host "Fazendo build da imagem..." -ForegroundColor Blue
Write-Host "   Usando Dockerfile.cloud-run" -ForegroundColor Yellow
docker build -f Dockerfile.cloud-run -t $IMAGE_NAME -t $LATEST_TAG .

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha no build da imagem" -ForegroundColor Red
    exit 1
}

# Push da imagem
Write-Host ""
Write-Host "Fazendo push da imagem para Container Registry..." -ForegroundColor Blue
docker push $IMAGE_NAME
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha no push da imagem $IMAGE_NAME" -ForegroundColor Red
    exit 1
}

docker push $LATEST_TAG
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha no push da imagem $LATEST_TAG" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "OK: Build e push concluidos com sucesso!" -ForegroundColor Green
Write-Host "   Imagem: $IMAGE_NAME" -ForegroundColor Green
Write-Host "   Latest: $LATEST_TAG" -ForegroundColor Green
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Yellow
Write-Host "   1. Secrets ja devem estar no Secret Manager:" -ForegroundColor Yellow
Write-Host "      - db-password" -ForegroundColor Yellow
Write-Host "      - jwt-secret" -ForegroundColor Yellow
Write-Host "   2. Faca o deploy manual no Console Web (veja GUIA_DEPLOY_MANUAL_CLOUD_RUN.md)" -ForegroundColor Yellow
