# Multi-stage build para imagem otimizada
# Stage 1: Build do Maven
FROM maven:3.9-eclipse-temurin-17 AS maven-build

WORKDIR /app

# Copiar arquivos de configuração Maven primeiro (cache layer)
COPY pom.xml .
COPY kernel-compartilhado/pom.xml ./kernel-compartilhado/
COPY gestao-cardapio/pom.xml ./gestao-cardapio/
COPY gestao-clientes/pom.xml ./gestao-clientes/
COPY gestao-pedidos/pom.xml ./gestao-pedidos/
COPY autenticacao/pom.xml ./autenticacao/
COPY sistema-orquestrador/pom.xml ./sistema-orquestrador/

# Baixar dependências (cache layer)
RUN mvn dependency:go-offline -B

# Copiar código fonte
COPY kernel-compartilhado ./kernel-compartilhado
COPY gestao-cardapio ./gestao-cardapio
COPY gestao-clientes ./gestao-clientes
COPY gestao-pedidos ./gestao-pedidos
COPY autenticacao ./autenticacao
COPY sistema-orquestrador ./sistema-orquestrador

# Build do backend
RUN mvn clean package -DskipTests -B

# Stage 2: Build do Frontend Angular
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

# Copiar package files
COPY frontend/package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte do frontend
COPY frontend ./

# Build do frontend
RUN npm run build

# Stage 3: Imagem final otimizada
FROM eclipse-temurin:17-jre-alpine

# Instalar MySQL (MariaDB) e dependências necessárias
RUN apk add --no-cache \
    mariadb \
    mariadb-client \
    bash \
    tini \
    wget \
    && rm -rf /var/cache/apk/*

# Criar diretórios
RUN mkdir -p /app /var/lib/mysql /var/run/mysqld /etc/mysql/conf.d /run/mysqld

# Criar usuário mysql se não existir
RUN addgroup -g 1001 mysql 2>/dev/null || true && \
    adduser -D -u 1001 -G mysql mysql 2>/dev/null || true

# Copiar JAR do backend
COPY --from=maven-build /app/sistema-orquestrador/target/sistema-orquestrador-*.jar /app/app.jar

# Copiar frontend buildado
COPY --from=frontend-build /app/frontend/dist/frontend/browser /app/static

# Copiar scripts de inicialização
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Configurar MySQL - inicializar banco de dados
RUN mysql_install_db --datadir=/var/lib/mysql --user=mysql --skip-test-db --auth-root-authentication-method=normal || \
    mariadb-install-db --datadir=/var/lib/mysql --user=mysql --skip-test-db --auth-root-authentication-method=normal

# Criar arquivo de configuração MySQL mínimo
RUN echo '[mysqld]' > /etc/mysql/conf.d/custom.cnf && \
    echo 'bind-address = 0.0.0.0' >> /etc/mysql/conf.d/custom.cnf && \
    echo 'port = 3306' >> /etc/mysql/conf.d/custom.cnf && \
    echo 'max_connections = 100' >> /etc/mysql/conf.d/custom.cnf && \
    echo 'innodb_buffer_pool_size = 128M' >> /etc/mysql/conf.d/custom.cnf && \
    echo 'skip-name-resolve' >> /etc/mysql/conf.d/custom.cnf && \
    echo 'skip-host-cache' >> /etc/mysql/conf.d/custom.cnf && \
    echo 'pid-file = /run/mysqld/mysqld.pid' >> /etc/mysql/conf.d/custom.cnf && \
    echo 'socket = /run/mysqld/mysqld.sock' >> /etc/mysql/conf.d/custom.cnf

# Ajustar permissões
RUN chown -R mysql:mysql /var/lib/mysql /var/run/mysqld /run/mysqld /etc/mysql

# Variáveis de ambiente padrão (valores devem ser fornecidos via variáveis de ambiente ou secrets)
# IMPORTANTE: DB_PASSWORD e JWT_SECRET devem ser fornecidos via variáveis de ambiente/secrets
# NUNCA hardcode credenciais sensíveis aqui!
ENV DB_HOST=localhost
ENV DB_PORT=3306
ENV DB_NAME=snackbar_db
ENV DB_USERNAME=snackbar_user
# DB_PASSWORD deve ser fornecido via variável de ambiente ou secret
ENV DB_URL=jdbc:mysql://localhost:3306/snackbar_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=America/Sao_Paulo
ENV SERVER_PORT=8080
# JWT_SECRET deve ser fornecido via variável de ambiente ou secret (mínimo 256 bits)
ENV JWT_EXPIRATION=86400
ENV SHOW_SQL=false
ENV LOG_LEVEL=INFO

# Expor portas
EXPOSE 8080 3306

# Usar tini como init system
ENTRYPOINT ["/sbin/tini", "--", "/usr/local/bin/docker-entrypoint.sh"]

