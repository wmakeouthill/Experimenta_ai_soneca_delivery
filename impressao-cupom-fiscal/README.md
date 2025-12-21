# Módulo de Impressão de Cupom Fiscal

Módulo responsável pela impressão de cupons fiscais em impressoras térmicas, seguindo os princípios de Clean Architecture, Clean Code e DRY.

## 🎯 Funcionalidades

- Impressão de cupons fiscais em formato similar ao iFood
- Suporte para múltiplas impressoras térmicas:
  - **EPSON TM-T20**
  - **DARUMA DR-800**
  - **Impressoras genéricas ESC/POS**
- Modo de teste (salva em arquivo .prn)
- Formatação automática do cupom com dados do pedido

## 🏗️ Arquitetura

O módulo segue Clean Architecture com as seguintes camadas:

### Domain Layer
- **Entities**: `CupomFiscal`, `TipoImpressora`
- **Value Objects**: `ConfiguracaoImpressora`
- **Ports**: `ImpressoraPort`, `ImpressaoException`

### Application Layer
- **Use Cases**: `ImprimirCupomFiscalUseCase`
- **DTOs**: `ImprimirCupomRequest`, `ImprimirCupomResponse`
- **Ports**: `PedidoServicePort`

### Infrastructure Layer
- **Impressoras**: Implementações usando Strategy Pattern
  - `EpsonTmT20ImpressoraAdapter`
  - `Daruma800ImpressoraAdapter`
  - `GenericaEscPosImpressoraAdapter`
- **Formatação**: `FormatoCupomFiscal` (formatação do cupom)
- **Comandos ESC/POS**: `EscPosComandos` (comandos de impressão)
- **Web**: `CupomFiscalRestController`, `PedidoServiceAdapter`

## 📋 Configuração

### 1. Adicionar ao sistema-orquestrador

O módulo já está incluído no `pom.xml` do sistema-orquestrador.

### 2. Configurar impressoras

**⚠️ IMPORTANTE:** As configurações devem ser adicionadas ao arquivo `application-secrets.yml` do **sistema-orquestrador**, não no módulo de impressão!

**Localização:** `sistema-orquestrador/src/main/resources/application-secrets.yml`

Adicione as seguintes configurações ao seu `application-secrets.yml` (ou copie do `application-secrets.yml.example`):

```yaml
impressao:
  epson:
    tm-t20:
      device: /dev/usb/lp0  # Linux
      # device: COM3  # Windows
      modo-teste: true
  
  daruma:
    "800":
      device: /dev/usb/lp1
      modo-teste: true
  
  generica:
    device: /dev/usb/lp2
    modo-teste: true

estabelecimento:
  nome: "Snackbar"
  endereco: "Rua Exemplo, 123 - Centro"
  telefone: "(11) 1234-5678"
  cnpj: "12345678000190"
```

### 3. Modo de Teste vs Produção

- **Modo Teste (`modo-teste: true`)**: Salva o cupom em arquivo `.prn` no diretório raiz
- **Modo Produção (`modo-teste: false`)**: Envia diretamente para a impressora no caminho configurado

## 🚀 Uso

### API REST

**Endpoint**: `POST /api/impressao/cupom-fiscal`

**Request**:
```json
{
  "pedidoId": "123e4567-e89b-12d3-a456-426614174000",
  "tipoImpressora": "EPSON_TM_T20",
  "nomeImpressora": "EPSON TM-T20",
  "nomeEstabelecimento": "Snackbar",
  "enderecoEstabelecimento": "Rua Exemplo, 123",
  "telefoneEstabelecimento": "(11) 1234-5678",
  "cnpjEstabelecimento": "12345678000190"
}
```

**Response**:
```json
{
  "sucesso": true,
  "mensagem": "Cupom fiscal impresso com sucesso",
  "dataImpressao": "2025-01-27T10:30:00",
  "pedidoId": "123e4567-e89b-12d3-a456-426614174000"
}
```

### Tipos de Impressora

- `EPSON_TM_T20`: EPSON TM-T20
- `DARUMA_800`: DARUMA DR-800
- `GENERICA_ESCPOS`: Impressora genérica ESC/POS

## 📄 Formato do Cupom

O cupom é formatado automaticamente com:

1. **Cabeçalho**: Nome do estabelecimento, endereço, telefone, CNPJ
2. **Dados do Pedido**: Número do pedido, cliente, data/hora
3. **Itens**: Lista de produtos com quantidade e valores
4. **Total**: Valor total do pedido
5. **Formas de Pagamento**: Meios de pagamento utilizados
6. **Rodapé**: Mensagem de agradecimento

## 🔧 Comandos ESC/POS

O módulo implementa comandos ESC/POS diretamente para:
- Inicialização da impressora
- Alinhamento (esquerda, centro, direita)
- Formatação de texto (normal, negrito, grande, duplo)
- Corte de papel (total, parcial)
- Abertura de gaveta

## 🧪 Testes

Em modo de teste, os cupons são salvos em arquivos `.prn` que podem ser:
- Visualizados com editores de texto
- Enviados para impressoras usando comandos do sistema:
  ```bash
  # Linux
  cat cupom_epson_001.prn > /dev/usb/lp0
  
  # Windows
  copy /b cupom_epson_001.prn COM3
  ```

## 📝 Notas Técnicas

- **Largura padrão**: 48 caracteres (80mm de papel)
- **Encoding**: UTF-8
- **Protocolo**: ESC/POS (compatível com a maioria das impressoras térmicas)
- **Integração**: Usa injeção direta do `BuscarPedidoPorIdUseCase` do módulo de pedidos

## 🔄 Integração com Módulo de Pedidos

O módulo se integra com `gestao-pedidos` através do `PedidoServiceAdapter`, que injeta diretamente o `BuscarPedidoPorIdUseCase` para buscar dados do pedido.

## ⚠️ Observações

- No Windows, use `COM1`, `COM2`, etc. como caminho do dispositivo
- No Linux, use `/dev/usb/lp0`, `/dev/usb/lp1`, etc.
- Certifique-se de que o usuário tenha permissões para acessar o dispositivo da impressora
- Em produção, configure `modo-teste: false` e o caminho correto do dispositivo

