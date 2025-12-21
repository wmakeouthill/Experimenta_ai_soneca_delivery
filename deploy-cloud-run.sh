#!/bin/bash
# Script completo de deploy para Google Cloud Run com Cloud SQL e Secret Manager
# Uso: ./deploy-cloud-run.sh [PROJECT_ID] [REGION] [CLOUD_SQL_INSTANCE]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Deploy do Snackbar App para Google Cloud Run${NC}"
echo -e "${GREEN}   Com Cloud SQL e Secret Manager${NC}"
echo ""

# Verificar se gcloud está instalado
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI não está instalado. Instale em: https://cloud.google.com/sdk/docs/install${NC}"
    exit 1
fi

# Verificar se está autenticado
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${YELLOW}⚠️  Você não está autenticado. Fazendo login...${NC}"
    gcloud auth login
fi

# Solicitar PROJECT_ID se não fornecido
if [ -z "$1" ]; then
    echo -e "${YELLOW}📋 Projetos disponíveis:${NC}"
    gcloud projects list --format="table(projectId,name)"
    echo ""
    read -p "Digite o PROJECT_ID: " PROJECT_ID
else
    PROJECT_ID=$1
fi

# Definir região (default: us-central1)
REGION=${2:-us-central1}

# Configurar projeto
echo -e "${GREEN}⚙️  Configurando projeto: ${PROJECT_ID}${NC}"
gcloud config set project "$PROJECT_ID"

# Habilitar APIs necessárias
echo -e "${GREEN}🔧 Habilitando APIs necessárias...${NC}"
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    secretmanager.googleapis.com \
    containerregistry.googleapis.com \
    sqladmin.googleapis.com \
    --project="$PROJECT_ID"

# Verificar ou criar secrets
echo ""
echo -e "${GREEN}🔐 Configurando Secret Manager...${NC}"

# DB Password
if ! gcloud secrets describe db-password --project="$PROJECT_ID" &> /dev/null; then
    echo -e "${YELLOW}⚠️  Secret 'db-password' não existe. Criando...${NC}"
    read -sp "Digite a senha do banco de dados MySQL: " DB_PASS
    echo ""
    if [ -z "$DB_PASS" ]; then
        echo -e "${RED}❌ Senha não pode ser vazia${NC}"
        exit 1
    fi
    echo -n "$DB_PASS" | gcloud secrets create db-password \
        --data-file=- \
        --replication-policy="automatic" \
        --project="$PROJECT_ID"
    echo -e "${GREEN}✅ Secret 'db-password' criado${NC}"
else
    echo -e "${GREEN}✅ Secret 'db-password' já existe${NC}"
fi

# JWT Secret
if ! gcloud secrets describe jwt-secret --project="$PROJECT_ID" &> /dev/null; then
    echo -e "${YELLOW}⚠️  Secret 'jwt-secret' não existe. Criando...${NC}"
    read -sp "Digite o JWT secret (mínimo 32 caracteres): " JWT_SECRET
    echo ""
    if [ -z "$JWT_SECRET" ]; then
        echo -e "${YELLOW}⚠️  JWT secret vazio. Gerando automaticamente...${NC}"
        JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)
        echo -e "${GREEN}   JWT secret gerado: ${JWT_SECRET:0:20}...${NC}"
    fi
    echo -n "$JWT_SECRET" | gcloud secrets create jwt-secret \
        --data-file=- \
        --replication-policy="automatic" \
        --project="$PROJECT_ID"
    echo -e "${GREEN}✅ Secret 'jwt-secret' criado${NC}"
else
    echo -e "${GREEN}✅ Secret 'jwt-secret' já existe${NC}"
fi

# OpenAI API Key (para módulo chat-ia)
if ! gcloud secrets describe openai-api-key --project="$PROJECT_ID" &> /dev/null; then
    echo -e "${YELLOW}⚠️  Secret 'openai-api-key' não existe. Criando...${NC}"
    read -sp "Digite a API Key da OpenAI (sk-...): " OPENAI_KEY
    echo ""
    if [ -z "$OPENAI_KEY" ]; then
        echo -e "${YELLOW}⚠️  OpenAI API Key vazia. O módulo de chat IA não funcionará.${NC}"
        echo -e "${YELLOW}   Você pode adicionar depois com: gcloud secrets create openai-api-key --data-file=-${NC}"
    else
        echo -n "$OPENAI_KEY" | gcloud secrets create openai-api-key \
            --data-file=- \
            --replication-policy="automatic" \
            --project="$PROJECT_ID"
        echo -e "${GREEN}✅ Secret 'openai-api-key' criado${NC}"
    fi
else
    echo -e "${GREEN}✅ Secret 'openai-api-key' já existe${NC}"
fi

# Obter número do projeto para permissões
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")

# Configurar permissões para Cloud Run acessar secrets
echo ""
echo -e "${GREEN}🔑 Configurando permissões do Secret Manager...${NC}"

# Cloud Run Service Account (compute default)
CLOUD_RUN_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
gcloud secrets add-iam-policy-binding db-password \
    --member="serviceAccount:${CLOUD_RUN_SA}" \
    --role="roles/secretmanager.secretAccessor" \
    --project="$PROJECT_ID" \
    --quiet || echo -e "${YELLOW}⚠️  Permissão já configurada ou erro (continuando...)${NC}"

gcloud secrets add-iam-policy-binding jwt-secret \
    --member="serviceAccount:${CLOUD_RUN_SA}" \
    --role="roles/secretmanager.secretAccessor" \
    --project="$PROJECT_ID" \
    --quiet || echo -e "${YELLOW}⚠️  Permissão já configurada ou erro (continuando...)${NC}"

# Permissão para OpenAI API Key (se existir)
if gcloud secrets describe openai-api-key --project="$PROJECT_ID" &> /dev/null; then
    gcloud secrets add-iam-policy-binding openai-api-key \
        --member="serviceAccount:${CLOUD_RUN_SA}" \
        --role="roles/secretmanager.secretAccessor" \
        --project="$PROJECT_ID" \
        --quiet || echo -e "${YELLOW}⚠️  Permissão já configurada ou erro (continuando...)${NC}"
fi

# Verificar Cloud SQL Instance
echo ""
echo -e "${GREEN}🗄️  Configurando Cloud SQL...${NC}"

if [ -z "$3" ]; then
    echo -e "${YELLOW}📋 Instâncias Cloud SQL disponíveis:${NC}"
    gcloud sql instances list --project="$PROJECT_ID" --format="table(name,region,databaseVersion,status)" || echo -e "${YELLOW}   Nenhuma instância encontrada${NC}"
    echo ""
    read -p "Digite o nome da instância Cloud SQL (formato: PROJECT_ID:REGION:INSTANCE_NAME ou INSTANCE_NAME): " CLOUD_SQL_INSTANCE_INPUT
    CLOUD_SQL_INSTANCE="$CLOUD_SQL_INSTANCE_INPUT"
else
    CLOUD_SQL_INSTANCE=$3
fi

# Validar formato da instância Cloud SQL
if [[ "$CLOUD_SQL_INSTANCE" != *":"* ]]; then
    # Se não tem formato completo, construir
    CLOUD_SQL_CONNECTION_NAME="${PROJECT_ID}:${REGION}:${CLOUD_SQL_INSTANCE}"
else
    CLOUD_SQL_CONNECTION_NAME="$CLOUD_SQL_INSTANCE"
fi

echo -e "${BLUE}   Usando conexão Cloud SQL: ${CLOUD_SQL_CONNECTION_NAME}${NC}"

# Configurar permissões para Cloud Run acessar Cloud SQL
echo -e "${GREEN}🔗 Configurando conexão Cloud SQL...${NC}"
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${CLOUD_RUN_SA}" \
    --role="roles/cloudsql.client" \
    --quiet || echo -e "${YELLOW}⚠️  Permissão já configurada (continuando...)${NC}"

# Solicitar informações do banco
read -p "Digite o nome do banco de dados (default: soneca_delivery_db): " DB_NAME
DB_NAME=${DB_NAME:-soneca_delivery_db}

read -p "Digite o usuário do banco de dados (default: soneca_delivery_user): " DB_USERNAME
DB_USERNAME=${DB_USERNAME:-soneca_delivery_user}

# Construir DB_URL para Cloud SQL
# Formato: jdbc:mysql:///DATABASE_NAME?cloudSqlInstance=CONNECTION_NAME&socketFactory=com.google.cloud.sql.mysql.SocketFactory
DB_URL="jdbc:mysql:///${DB_NAME}?cloudSqlInstance=${CLOUD_SQL_CONNECTION_NAME}&socketFactory=com.google.cloud.sql.mysql.SocketFactory&useSSL=false&serverTimezone=America/Sao_Paulo"

# Imagem a ser usada
IMAGE_NAME="gcr.io/${PROJECT_ID}/soneca-delivery-app:latest"

# Verificar se a imagem existe
echo ""
echo -e "${GREEN}🔍 Verificando imagem Docker...${NC}"
if ! gcloud container images describe "$IMAGE_NAME" --project="$PROJECT_ID" &> /dev/null; then
    echo -e "${YELLOW}⚠️  Imagem não encontrada. Execute primeiro: ./build-and-push.sh ${PROJECT_ID}${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Imagem encontrada: ${IMAGE_NAME}${NC}"

# Deploy no Cloud Run
echo ""
echo -e "${BLUE}🚀 Fazendo deploy no Cloud Run...${NC}"
echo -e "${YELLOW}   Isso pode levar alguns minutos...${NC}"

gcloud run deploy soneca-delivery-app \
    --image "$IMAGE_NAME" \
    --region "$REGION" \
    --platform managed \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 2 \
    --timeout 300 \
    --max-instances 10 \
    --min-instances 0 \
    --port 8080 \
    --add-cloudsql-instances "$CLOUD_SQL_CONNECTION_NAME" \
    --set-secrets="DB_PASSWORD=db-password:latest,JWT_SECRET=jwt-secret:latest" \
    --set-env-vars="DB_HOST=/cloudsql/${CLOUD_SQL_CONNECTION_NAME},DB_PORT=3306,DB_NAME=${DB_NAME},DB_USERNAME=${DB_USERNAME},DB_URL=${DB_URL},SERVER_PORT=8080,JWT_EXPIRATION=86400,SHOW_SQL=false,LOG_LEVEL=INFO,SPRING_PROFILES_ACTIVE=prod" \
    --project="$PROJECT_ID"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro no deploy${NC}"
    exit 1
fi

# Obter URL do serviço
SERVICE_URL=$(gcloud run services describe soneca-delivery-app \
    --region "$REGION" \
    --format="value(status.url)" \
    --project="$PROJECT_ID")

echo ""
echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo ""
echo -e "${GREEN}🌐 URL do serviço: ${SERVICE_URL}${NC}"
echo ""
echo -e "${YELLOW}📝 Informações do deploy:${NC}"
echo -e "   Projeto: ${PROJECT_ID}"
echo -e "   Região: ${REGION}"
echo -e "   Cloud SQL: ${CLOUD_SQL_CONNECTION_NAME}"
echo -e "   Banco de dados: ${DB_NAME}"
echo -e "   Usuário: ${DB_USERNAME}"
echo ""
echo -e "${YELLOW}⚠️  LEMBRE-SE:${NC}"
echo -e "${YELLOW}   - Certifique-se de que o banco de dados existe no Cloud SQL${NC}"
echo -e "${YELLOW}   - Certifique-se de que o usuário tem permissões adequadas${NC}"
echo -e "${YELLOW}   - Execute as migrações Liquibase se necessário${NC}"
