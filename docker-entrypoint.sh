#!/bin/bash
set -e

# Função para aguardar MySQL estar pronto
wait_for_mysql() {
    echo "Aguardando MySQL iniciar..."
    local max_attempts=60
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if mysqladmin ping -h localhost --silent 2>/dev/null || \
           mysqladmin ping -h 127.0.0.1 --silent 2>/dev/null; then
            echo "✅ MySQL está pronto!"
            return 0
        fi
        echo "⏳ Tentativa $attempt/$max_attempts: MySQL ainda não está pronto..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "❌ Erro: MySQL não iniciou a tempo"
    return 1
}

# Ajustar permissões
chown -R mysql:mysql /var/lib/mysql /var/run/mysqld /run/mysqld 2>/dev/null || true

# Iniciar MySQL em background
echo "🚀 Iniciando MySQL..."
mysqld_safe --datadir=/var/lib/mysql --user=mysql --skip-networking=0 --bind-address=0.0.0.0 &

# Aguardar MySQL estar pronto
if ! wait_for_mysql; then
    echo "❌ Falha ao iniciar MySQL. Verificando logs..."
    tail -n 50 /var/lib/mysql/*.err 2>/dev/null || true
    exit 1
fi

# Criar banco de dados e usuário se não existirem
echo "📦 Configurando banco de dados..."
mysql -u root <<EOF || true
CREATE DATABASE IF NOT EXISTS ${DB_NAME};
CREATE USER IF NOT EXISTS '${DB_USERNAME}'@'%' IDENTIFIED BY '${DB_PASSWORD}';
CREATE USER IF NOT EXISTS '${DB_USERNAME}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USERNAME}'@'%';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USERNAME}'@'localhost';
FLUSH PRIVILEGES;
EOF

echo "✅ Banco de dados configurado com sucesso!"

# Iniciar aplicação Spring Boot
echo "🚀 Iniciando aplicação Spring Boot..."
exec java -jar \
    -Dspring.profiles.active=prod \
    -Dspring.datasource.url="${DB_URL}" \
    -Dspring.datasource.username="${DB_USERNAME}" \
    -Dspring.datasource.password="${DB_PASSWORD}" \
    -Dserver.port="${SERVER_PORT}" \
    -Djwt.secret="${JWT_SECRET}" \
    -Djwt.expiration="${JWT_EXPIRATION}" \
    -Dlogging.level.com.snackbar="${LOG_LEVEL}" \
    /app/app.jar

