const fs = require('fs');
const path = require('path');

// Função simples para ler arquivo .env manualmente e evitar dependência 'dotenv'
function carregarEnv(caminho) {
    const variaveis = {};
    if (fs.existsSync(caminho)) {
        const conteudo = fs.readFileSync(caminho, 'utf-8');
        const linhas = conteudo.split('\n');
        for (const linha of linhas) {
            const linhaTrim = linha.trim();
            // Ignora linhas vazias ou comentários
            if (!linhaTrim || linhaTrim.startsWith('#')) continue;

            const partes = linhaTrim.split('=');
            if (partes.length >= 2) {
                const chave = partes[0].trim();
                // Junta o resto caso o valor tenha '='. Ex: KEY=b=c
                const valor = partes.slice(1).join('=').trim();
                variaveis[chave] = valor;
            }
        }
        console.log(`Carregou variáveis manuais de: ${caminho}`);
    } else {
        console.log(`Arquivo .env não encontrado em: ${caminho}. Usando apenas variáveis de ambiente do sistema.`);
    }
    return variaveis;
}

const envFile = path.resolve(__dirname, '../.env');
// Carrega as variáveis do arquivo
const envVars = carregarEnv(envFile);

// Prioridade: Variável de ambiente do Sistema (Docker/OS) > Arquivo .env > Vazio
const clientId = process.env.GOOGLE_CLIENT_ID || envVars.GOOGLE_CLIENT_ID || '';
const mapsKey = process.env.GOOGLE_MAPS_API_KEY || envVars.GOOGLE_MAPS_API_KEY || '';

const targetPath = path.resolve(__dirname, '../src/environments/environment.ts');

const envConfigFile = `export const environment = {
  production: false,
  apiUrl: '/api',
  googleClientId: '${clientId}',
  googleMapsApiKey: '${mapsKey}'
};
`;

fs.writeFile(targetPath, envConfigFile, function (err) {
    if (err) {
        console.error('Erro ao gerar environment.ts:', err);
        process.exit(1);
    }
    console.log(`Environment file generated successfully at ${targetPath}`);
    if (!mapsKey) {
        console.warn('AVISO: Google Maps API Key está vazia!');
    }
});
