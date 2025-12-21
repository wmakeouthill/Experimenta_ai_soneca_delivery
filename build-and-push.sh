#!/bin/bash
# Script para build e push da imagem Docker para Google Container Registry
# Uso: ./build-and-push.sh [PROJECT_ID] [TAG]
# Project ID padrão: experimenta-ai-soneca-balcao

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🏗️  Build e Push da Imagem Docker para GCR${NC}"
echo ""

# Verificar se gcloud está instalado
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI não está instalado. Instale em: https://cloud.google.com/sdk/docs/install${NC}"
    exit 1
fi

# Verificar se está autenticado
echo -e "${GREEN}🔐 Verificando autenticação...${NC}"
ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | head -n 1)

if [ -z "$ACTIVE_ACCOUNT" ]; then
    echo -e "${RED}❌ Você não está autenticado.${NC}"
    echo ""
    echo -e "${YELLOW}📝 Para fazer login, execute:${NC}"
    echo -e "${YELLOW}   gcloud auth login${NC}"
    echo ""
    echo -e "${YELLOW}💡 Se fez login em outro terminal, tente:${NC}"
    echo -e "${YELLOW}   gcloud auth list${NC}"
    echo ""
    exit 1
else
    echo -e "${GREEN}✅ Autenticado como: ${ACTIVE_ACCOUNT}${NC}"
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

# Definir TAG (default: latest)
TAG=${2:-latest}

# Configurar projeto
echo -e "${GREEN}⚙️  Configurando projeto: ${PROJECT_ID}${NC}"
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")

if [ "$CURRENT_PROJECT" != "$PROJECT_ID" ]; then
    echo -e "${YELLOW}   Projeto atual: ${CURRENT_PROJECT:-'nenhum'}${NC}"
    echo -e "${YELLOW}   Mudando para: ${PROJECT_ID}${NC}"
    gcloud config set project "$PROJECT_ID" || {
        echo -e "${RED}❌ Erro ao configurar projeto${NC}"
        exit 1
    }
else
    echo -e "${GREEN}   Projeto já está configurado corretamente${NC}"
fi

# Habilitar Container Registry API se necessário
echo -e "${GREEN}🔧 Verificando APIs necessárias...${NC}"
gcloud services enable containerregistry.googleapis.com --project="$PROJECT_ID"

# Configurar Docker para usar gcloud como credencial helper
echo -e "${GREEN}🔐 Configurando credenciais Docker...${NC}"
gcloud auth configure-docker gcr.io --quiet

# Nome da imagem
IMAGE_NAME="gcr.io/${PROJECT_ID}/snackbar-app:${TAG}"
LATEST_TAG="gcr.io/${PROJECT_ID}/snackbar-app:latest"

# Build da imagem usando Dockerfile.cloud-run
echo -e "${BLUE}📦 Fazendo build da imagem...${NC}"
echo -e "${YELLOW}   Usando Dockerfile.cloud-run${NC}"
docker build -f Dockerfile.cloud-run -t "$IMAGE_NAME" -t "$LATEST_TAG" .

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro no build da imagem${NC}"
    exit 1
fi

# Push da imagem
echo ""
echo -e "${BLUE}🚀 Fazendo push da imagem para Container Registry...${NC}"
docker push "$IMAGE_NAME"
docker push "$LATEST_TAG"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro no push da imagem${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Build e push concluídos com sucesso!${NC}"
echo -e "${GREEN}   Imagem: ${IMAGE_NAME}${NC}"
echo -e "${GREEN}   Latest: ${LATEST_TAG}${NC}"
echo ""
echo -e "${YELLOW}📝 Próximos passos:${NC}"
echo -e "${YELLOW}   1. Secrets já devem estar no Secret Manager:${NC}"
echo -e "${YELLOW}      - db-password${NC}"
echo -e "${YELLOW}      - jwt-secret${NC}"
echo -e "${YELLOW}   2. Faça o deploy manual no Console Web (veja GUIA_DEPLOY_MANUAL_CLOUD_RUN.md)${NC}"
echo -e "${YELLOW}      Ou execute: ./deploy-cloud-run.sh ${PROJECT_ID}${NC}"

