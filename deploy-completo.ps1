# Script PowerShell completo: Build + Push + Deploy para Cloud Run
# Uso: .\deploy-completo.ps1 [PROJECT_ID] [REGION]
# Exemplo: .\deploy-completo.ps1 experimenta-ai-soneca-balcao southamerica-east1

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deploy Completo - Cloud Run" -ForegroundColor Cyan
Write-Host "  Build + Push + Deploy" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se gcloud esta instalado
$gcloudPath = Get-Command gcloud -ErrorAction SilentlyContinue
if (-not $gcloudPath) {
    Write-Host "ERRO: gcloud CLI nao esta instalado. Instale em: https://cloud.google.com/sdk/docs/install" -ForegroundColor Red
    exit 1
}

# Verificar autenticacao
Write-Host "[1/6] Verificando autenticacao..." -ForegroundColor Green
try {
    $authOutput = gcloud auth list --filter="status:ACTIVE" --format="value(account)" 2>&1
    $activeAccount = ($authOutput | Where-Object { $_ -notmatch 'ERROR|WARNING' } | Select-Object -First 1).ToString().Trim()
    
    if ([string]::IsNullOrWhiteSpace($activeAccount)) {
        Write-Host "ERRO: Voce nao esta autenticado." -ForegroundColor Red
        Write-Host "Execute: gcloud auth login" -ForegroundColor Yellow
        exit 1
    }
    else {
        Write-Host "OK: Autenticado como: $activeAccount" -ForegroundColor Green
    }
}
catch {
    Write-Host "ERRO: Nao foi possivel verificar autenticacao" -ForegroundColor Red
    exit 1
}

# Obter PROJECT_ID
if ($args.Count -eq 0) {
    Write-Host ""
    Write-Host "Projetos disponiveis:" -ForegroundColor Yellow
    gcloud projects list --format="table(projectId,name)" 2>&1 | Out-Host
    Write-Host ""
    $PROJECT_ID = Read-Host "Digite o PROJECT_ID"
}
else {
    $PROJECT_ID = $args[0]
}

# Obter REGION
$REGION = if ($args.Count -gt 1) { $args[1] } else { "southamerica-east1" }

Write-Host ""
Write-Host "[2/6] Configurando projeto: $PROJECT_ID" -ForegroundColor Green
try {
    $currentProject = (gcloud config get-value project 2>&1).ToString().Trim()
    
    if ($currentProject -ne $PROJECT_ID) {
        Write-Host "   Mudando projeto de '$currentProject' para '$PROJECT_ID'" -ForegroundColor Yellow
        gcloud config set project $PROJECT_ID
        if ($LASTEXITCODE -ne 0) {
            Write-Host "ERRO: Nao foi possivel configurar projeto" -ForegroundColor Red
            exit 1
        }
    }
    else {
        Write-Host "   OK: Projeto ja esta configurado" -ForegroundColor Green
    }
}
catch {
    Write-Host "ERRO: Nao foi possivel configurar projeto" -ForegroundColor Red
    exit 1
}

# Habilitar APIs
Write-Host ""
Write-Host "[3/6] Habilitando APIs necessarias..." -ForegroundColor Green
gcloud services enable containerregistry.googleapis.com --project=$PROJECT_ID
gcloud services enable run.googleapis.com --project=$PROJECT_ID
gcloud services enable secretmanager.googleapis.com --project=$PROJECT_ID

# Configurar Docker
Write-Host ""
Write-Host "[4/6] Configurando credenciais Docker..." -ForegroundColor Green
gcloud auth configure-docker gcr.io --quiet

# Build da imagem
Write-Host ""
Write-Host "[5/6] Fazendo build da imagem Docker..." -ForegroundColor Green
$IMAGE_NAME = "gcr.io/$PROJECT_ID/experimentaai-delivery:latest"
$TIMESTAMP_TAG = "gcr.io/$PROJECT_ID/experimentaai-delivery:$(Get-Date -Format 'yyyyMMddHHmmss')"

Write-Host "   Usando Dockerfile.cloud-run" -ForegroundColor Yellow
Write-Host "   Isso pode levar varios minutos..." -ForegroundColor Yellow

docker build -f Dockerfile.cloud-run -t $IMAGE_NAME -t $TIMESTAMP_TAG .

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha no build da imagem" -ForegroundColor Red
    exit 1
}

Write-Host "   OK: Build concluido" -ForegroundColor Green

# Push da imagem
Write-Host ""
Write-Host "[6/6] Fazendo push da imagem para Container Registry..." -ForegroundColor Green
Write-Host "   Isso pode levar alguns minutos..." -ForegroundColor Yellow

docker push $IMAGE_NAME
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha no push da imagem $IMAGE_NAME" -ForegroundColor Red
    exit 1
}

docker push $TIMESTAMP_TAG
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha no push da imagem $TIMESTAMP_TAG" -ForegroundColor Red
    exit 1
}

Write-Host "   OK: Push concluido" -ForegroundColor Green

# Informacoes finais
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Build e Push Concluidos!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Imagem: $IMAGE_NAME" -ForegroundColor Cyan
Write-Host "Tag com timestamp: $TIMESTAMP_TAG" -ForegroundColor Cyan
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Yellow
Write-Host "  1. Verifique se os secrets existem no Secret Manager:" -ForegroundColor Yellow
Write-Host "     - db-password" -ForegroundColor Yellow
Write-Host "     - jwt-secret" -ForegroundColor Yellow
Write-Host ""
Write-Host "  2. Faca o deploy no Cloud Run:" -ForegroundColor Yellow
Write-Host "     - Via Console Web (veja GUIA_DEPLOY_MANUAL_CLOUD_RUN.md)" -ForegroundColor Yellow
Write-Host "     - Ou configure o deploy automatico aqui no script" -ForegroundColor Yellow
Write-Host ""
Write-Host "Configuracao do Cloud Run:" -ForegroundColor Cyan
Write-Host "  - Project ID: $PROJECT_ID" -ForegroundColor Cyan
Write-Host "  - Region: $REGION" -ForegroundColor Cyan
Write-Host "  - Cloud SQL: experimenta-ai-soneca-balcao:southamerica-east1:experimenta-ai-balcao" -ForegroundColor Cyan
Write-Host "  - DB URL: jdbc:mysql:///experimentaai_delivery?cloudSqlInstance=experimenta-ai-soneca-balcao:southamerica-east1:experimenta-ai-balcao&socketFactory=com.google.cloud.sql.mysql.SocketFactory&useSSL=false&serverTimezone=America/Sao_Paulo" -ForegroundColor Cyan
Write-Host ""

# Perguntar se deseja fazer deploy automatico
$deploy = Read-Host "Deseja fazer deploy automatico no Cloud Run agora? (S/N)"
if ($deploy -eq "S" -or $deploy -eq "s" -or $deploy -eq "Y" -or $deploy -eq "y") {
    Write-Host ""
    Write-Host "Fazendo deploy no Cloud Run..." -ForegroundColor Green
    
    $CLOUD_SQL_CONNECTION = "experimenta-ai-soneca-balcao:southamerica-east1:experimenta-ai-balcao"
    $DB_URL = "jdbc:mysql:///experimentaai_delivery?cloudSqlInstance=$CLOUD_SQL_CONNECTION&socketFactory=com.google.cloud.sql.mysql.SocketFactory&useSSL=false&serverTimezone=America/Sao_Paulo"
    
    gcloud run deploy experimentaai-delivery `
        --image $IMAGE_NAME `
        --region $REGION `
        --platform managed `
        --allow-unauthenticated `
        --memory 2Gi `
        --cpu 2 `
        --timeout 600 `
        --cpu-boost `
        --max-instances 10 `
        --min-instances 0 `
        --port 8080 `
        --add-cloudsql-instances $CLOUD_SQL_CONNECTION `
        --set-secrets="DB_PASSWORD=db-password:latest,JWT_SECRET=jwt-secret:latest,OPENAI_API_KEY=openai-api-key:latest" `
        --set-env-vars="DB_HOST=/cloudsql/$CLOUD_SQL_CONNECTION,DB_PORT=3306,DB_NAME=$DB_NAME,DB_USERNAME=root,DB_URL=$DB_URL,SERVER_PORT=8080,PORT=8080,SPRING_PROFILES_ACTIVE=prod,SHOW_SQL=false,JWT_EXPIRATION=86400,LOG_LEVEL=INFO,OPENAI_MODEL=gpt-4o-mini,OPENAI_MAX_TOKENS=4000,OPENAI_MODELS_FALLBACK=gpt-4o-mini" `
        --project=$PROJECT_ID
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "OK: Deploy concluido com sucesso!" -ForegroundColor Green
        $SERVICE_URL = gcloud run services describe experimentaai-delivery --region $REGION --format="value(status.url)" --project=$PROJECT_ID
        Write-Host "URL do servico: $SERVICE_URL" -ForegroundColor Cyan
    }
    else {
        Write-Host "ERRO: Falha no deploy" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Concluido!" -ForegroundColor Green

