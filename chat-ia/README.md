# 🤖 Chat IA - Módulo de Assistente Virtual

Módulo de chat com IA usando OpenAI API para assistência virtual aos clientes durante o pedido.

## Arquitetura

O módulo segue **Clean Architecture** com separação em camadas:

```
chat-ia/
├── src/main/java/com/snackbar/chatia/
│   ├── domain/                    # Regras de negócio puras
│   │   ├── entity/
│   │   │   └── MensagemChat.java  # Record imutável para mensagens
│   │   ├── valueobjects/
│   │   │   └── SessionId.java     # Value Object para sessão
│   │   └── repository/
│   │       └── HistoricoChatRepository.java  # Interface (Port)
│   │
│   ├── application/               # Casos de uso e DTOs
│   │   ├── dto/
│   │   │   ├── ChatRequestDTO.java
│   │   │   └── ChatResponseDTO.java
│   │   ├── port/
│   │   │   ├── in/
│   │   │   │   ├── EnviarMensagemChatUseCase.java
│   │   │   │   └── LimparHistoricoChatUseCase.java
│   │   │   └── out/
│   │   │       └── IAClientPort.java
│   │   └── usecase/
│   │       ├── EnviarMensagemChatUseCaseImpl.java
│   │       └── LimparHistoricoChatUseCaseImpl.java
│   │
│   └── infrastructure/            # Implementações técnicas
│       ├── ai/
│       │   └── OpenAIAdapter.java  # Integração com OpenAI
│       ├── persistence/
│       │   └── HistoricoChatMemoriaRepository.java
│       ├── web/
│       │   └── ChatIAController.java
│       └── config/
│           └── ChatIAConfig.java
```

## API REST

### Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/chat-ia` | Envia mensagem para o chat |
| `POST` | `/api/chat-ia/clear` | Limpa histórico da sessão |
| `GET` | `/api/chat-ia/health` | Health check do serviço |

### Exemplo de Request

```json
POST /api/chat-ia
X-Session-ID: uuid-da-sessao

{
  "message": "Quais são os lanches disponíveis?"
}
```

### Exemplo de Response

```json
{
  "reply": "Olá! 😊 Temos vários lanches deliciosos! Os mais pedidos são o X-Burguer, X-Salada e o X-Bacon. Quer que eu detalhe algum deles?"
}
```

## Configuração

### Variáveis de Ambiente

```properties
# Chave da API OpenAI (obrigatória)
OPENAI_API_KEY=sk-...

# Ou via application.properties
openai.api.key=sk-...
```

### application.properties

```properties
# Modelo principal (padrão: gpt-5-mini)
openai.model=gpt-5-mini

# Modelo de fallback (apenas um modelo)
openai.models.fallback=gpt-4o-mini

# Máximo de tokens na resposta
openai.max-tokens=4000

# Prompt do sistema (customizável)
chat.ia.system-prompt=Você é o Soneca, um assistente virtual simpático...
```

## Frontend

### Service

```typescript
// Arquivo: frontend/src/app/services/chat-ia.service.ts
@Injectable({ providedIn: 'root' })
export class ChatIAService {
  enviarMensagem(mensagem: string, sessionId?: string): Observable<ChatIAResponse>;
  limparHistorico(sessionId?: string): Observable<void>;
}
```

### Composable

```typescript
// Arquivo: frontend/src/app/components/pedido-cliente-mesa/composables/use-chat-ia.ts
const chatIA = useChatIA();

// Estado reativo
chatIA.isOpen()       // boolean - chat aberto/fechado
chatIA.isLoading()    // boolean - aguardando resposta
chatIA.mensagens()    // MensagemChat[] - lista de mensagens
chatIA.inputText()    // string - texto digitado
chatIA.canSend()      // boolean - pode enviar

// Métodos
chatIA.abrirChat()
chatIA.fecharChat()
chatIA.enviarMensagem()
chatIA.novaConversa()
```

### Componentes

- `ChatIAButtonComponent` - Botão flutuante com ícone do Soneca
- `ChatIAFullscreenComponent` - Chat em tela cheia responsivo

## Integração

O chat é integrado automaticamente na tela de pedido do cliente (`pedido-cliente-mesa`):

1. O botão aparece quando o cliente está na etapa "cardápio"
2. Ao clicar, abre o chat em tela cheia (fullscreen no mobile)
3. As mensagens são persistidas no sessionStorage
4. O histórico é mantido por 30 minutos no backend

## Recursos

- ✅ Chat em tempo real com IA
- ✅ Histórico de mensagens por sessão
- ✅ Persistência local no navegador
- ✅ Interface responsiva (mobile-first)
- ✅ Suporte a temas dark mode
- ✅ Fallback automático entre modelos OpenAI
- ✅ Indicador de digitação
- ✅ Emoji support
- ✅ Safe area para iPhone X+
