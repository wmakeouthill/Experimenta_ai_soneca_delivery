import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  effect,
  ViewChild,
  ElementRef,
  AfterViewChecked
} from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MensagemChat, ProdutoDestacado, ConversaSalva } from '../composables/use-chat-ia';
import { FormatoUtil } from '../../../utils/formato.util';

/**
 * Componente de Chat IA fullscreen responsivo.
 * Otimizado para uso em dispositivos móveis.
 * Suporta renderização de cards de produtos com opção de adicionar ao carrinho.
 */
@Component({
  selector: 'app-chat-ia-fullscreen',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chat-ia-overlay" [class.aberto]="isOpen() && !isHidden()" (click)="fecharAoClicarFora($event)">
      <div class="chat-ia-container" (click)="$event.stopPropagation()">
        <!-- Header -->
        <header class="chat-ia-header">
          <div class="chat-ia-header-info">
            <img src="/assets/soneca_ai.webp" alt="Soneca IA" class="chat-ia-avatar">
            <div class="chat-ia-header-text">
              <h2>Soneca</h2>
              <span class="status-online">● Online</span>
            </div>
          </div>

          <!-- Carrinho no centro do header -->
          @if (quantidadeItensCarrinho() > 0) {
            <button
              class="btn-carrinho-header"
              [class.bounce]="animarCarrinho()"
              (click)="onAbrirCarrinho.emit()"
              title="Ver carrinho">
              <span class="carrinho-icon">🛒</span>
              <span class="carrinho-badge">{{ quantidadeItensCarrinho() }}</span>
            </button>
          }

          <div class="chat-ia-header-actions">
            <button
              class="btn-historico-header"
              [class.ativo]="mostrarHistorico()"
              (click)="onToggleHistorico.emit()"
              title="Ver conversas anteriores">
              📜
            </button>
            <button class="btn-fechar" (click)="onClose.emit()" title="Fechar">
              ✕
            </button>
          </div>
        </header>

        <!-- Mensagens -->
        <div class="chat-ia-messages" #messagesContainer>
          @for (msg of mensagens(); track msg.id) {
            <div class="chat-ia-message" [class.user]="msg.from === 'user'" [class.assistant]="msg.from === 'assistant'">
              @if (msg.from === 'assistant') {
                <img src="/assets/soneca_ai.webp" alt="Soneca" class="message-avatar">
              }
              <div class="message-content">
                <div class="message-bubble">
                  <p class="message-text">{{ msg.text }}</p>
                  <span class="message-time">{{ formatTime(msg.timestamp) }}</span>
                </div>

                <!-- Cards de produtos destacados, agrupados por categoria -->
                @if (msg.produtosDestacados && msg.produtosDestacados.length > 0) {
                  <div class="produtos-destacados">
                    @for (categoria of agruparPorCategoria(msg.produtosDestacados); track categoria.nome) {
                      <div class="categoria-grupo">
                        <h5 class="categoria-titulo">📁 {{ categoria.nome }}</h5>
                        @for (produto of categoria.produtos; track produto.id) {
                          <div class="produto-card"
                               [class.indisponivel]="!produto.disponivel"
                               (click)="adicionarAoCarrinho(produto)">
                            @if (produto.imagemUrl) {
                              <img [src]="produto.imagemUrl" [alt]="produto.nome" class="produto-imagem">
                            } @else {
                              <div class="produto-imagem-placeholder">🍔</div>
                            }
                            <div class="produto-info">
                              <h4 class="produto-nome">{{ produto.nome }}</h4>
                              @if (produto.descricao) {
                                <p class="produto-descricao">{{ produto.descricao }}</p>
                              }
                              <div class="produto-footer">
                                <span class="produto-preco">{{ produto.preco | currency:'BRL':'symbol':'1.2-2' }}</span>
                                @if (produto.disponivel) {
                                  <button
                                    class="btn-adicionar"
                                    (click)="adicionarAoCarrinho(produto); $event.stopPropagation()"
                                    title="Adicionar ao carrinho">
                                    + Adicionar
                                  </button>
                                } @else {
                                  <span class="produto-indisponivel">Indisponível</span>
                                }
                              </div>
                            </div>
                          </div>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          }

          @if (isLoading()) {
            <div class="chat-ia-message assistant">
              <img src="/assets/soneca_ai.webp" alt="Soneca" class="message-avatar">
              <div class="message-bubble typing">
                <div class="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Painel de Histórico -->
        @if (mostrarHistorico()) {
          <div class="historico-panel">
            <div class="historico-header">
              <h3>📜 Conversas Anteriores</h3>
              <button class="btn-fechar-historico" (click)="onToggleHistorico.emit()">✕</button>
            </div>
            <div class="historico-lista">
              @if (historicoConversas().length === 0) {
                <div class="historico-vazio">
                  <span>💬</span>
                  <p>Nenhuma conversa anterior</p>
                </div>
              } @else {
                @for (conversa of historicoConversas(); track conversa.id) {
                  <div class="historico-item" (click)="onCarregarConversa.emit(conversa.id)">
                    <div class="historico-item-titulo">{{ conversa.titulo }}</div>
                    <div class="historico-item-preview">{{ conversa.previewUltimaMensagem }}</div>
                    <div class="historico-item-data">{{ formatDate(conversa.dataUltimaMensagem) }}</div>
                    <button
                      class="btn-remover-conversa"
                      (click)="onRemoverConversa.emit(conversa.id); $event.stopPropagation()"
                      title="Remover conversa">
                      🗑️
                    </button>
                  </div>
                }
              }
            </div>
          </div>
        }

        <!-- Input -->
        <footer class="chat-ia-input-area" #inputArea>
          <div class="input-wrapper">
            <input
              #chatInput
              type="text"
              [ngModel]="inputText()"
              (ngModelChange)="onInputChange.emit($event)"
              (keydown.enter)="enviar()"
              (focus)="onInputFocus()"
              placeholder="Digite sua mensagem..."
              [disabled]="isLoading()"
              class="chat-ia-input"
              autocomplete="off"
              enterkeyhint="send">
            <button
              class="btn-nova-conversa-input"
              (click)="onNovaConversa.emit()"
              title="Nova conversa">
              ✨
            </button>
            <button
              class="btn-enviar"
              [disabled]="!canSend()"
              (click)="enviar()">
              @if (isLoading()) {
                <span class="spinner-mini"></span>
              } @else {
                ➤
              }
            </button>
          </div>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .chat-ia-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s ease, visibility 0.3s ease;
      /* Fonts otimizadas para mobile */
      font-family:
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        'Segoe UI',
        'Roboto',
        'Noto Sans',
        'Helvetica Neue', Arial,
        sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .chat-ia-overlay.aberto {
      opacity: 1;
      visibility: visible;
    }

    .chat-ia-container {
      position: relative;
      width: 100%;
      /* Usa altura visual do viewport que se ajusta ao teclado no mobile */
      height: 100dvh;
      height: 100svh; /* Fallback para small viewport height */
      max-width: 100dvw;
      background: var(--bg-primary, #1a1a2e);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* Mobile: ajuste quando teclado abre */
    @supports (height: 100dvh) {
      .chat-ia-container {
        height: 100dvh;
      }
    }

    /* Desktop: chat como modal */
    @media (min-width: 769px) {
      .chat-ia-container {
        width: 450px;
        max-width: 90vw;
        height: 600px;
        max-height: 85vh;
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
      }
    }

    /* Header */
    .chat-ia-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      background: linear-gradient(135deg, #e67e22 0%, #d35400 100%);
      color: white;
      flex-shrink: 0;
    }

    .chat-ia-header-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .chat-ia-avatar {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.3);
      object-fit: cover;
    }

    .chat-ia-header-text h2 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
    }

    .status-online {
      font-size: 0.75rem;
      opacity: 0.9;
      color: #2ecc71;
    }

    .chat-ia-header-actions {
      display: flex;
      gap: 0.5rem;
    }

    /* Botão do carrinho no header */
    .btn-carrinho-header {
      position: relative;
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s ease, transform 0.2s ease;
      margin: 0 0.5rem;
    }

    .btn-carrinho-header:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.1);
    }

    .btn-carrinho-header:active {
      transform: scale(0.95);
    }

    .carrinho-icon {
      font-size: 1.3rem;
    }

    .carrinho-badge {
      position: absolute;
      top: -2px;
      right: -2px;
      background: #2ecc71;
      color: white;
      font-size: 0.65rem;
      font-weight: 700;
      min-width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #e67e22;
      animation: popIn 0.3s ease;
    }

    @keyframes popIn {
      0% { transform: scale(0); }
      50% { transform: scale(1.3); }
      100% { transform: scale(1); }
    }

    /* Animação de bounce quando adiciona item */
    .btn-carrinho-header.bounce {
      animation: cartBounce 0.6s ease;
    }

    @keyframes cartBounce {
      0%, 100% { transform: scale(1); }
      20% { transform: scale(1.2) rotate(-5deg); }
      40% { transform: scale(1.3) rotate(5deg); }
      60% { transform: scale(1.2) rotate(-3deg); }
      80% { transform: scale(1.1) rotate(2deg); }
    }

    .btn-nova-conversa,
    .btn-fechar,
    .btn-historico-header {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s ease;
      flex-shrink: 0;
    }

    .btn-nova-conversa:hover,
    .btn-fechar:hover,
    .btn-historico-header:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .btn-historico-header.ativo {
      background: rgba(255, 255, 255, 0.4);
    }

    /* Messages */
    .chat-ia-messages {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      background: var(--bg-secondary, #16213e);
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: contain;
      /* Garante que o container de mensagens ocupe o espaço disponível */
      min-height: 0;
      /* Suporte para scroll suave */
      scroll-behavior: smooth;
    }

    .chat-ia-message {
      display: flex;
      gap: 0.5rem;
      max-width: 85%;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .chat-ia-message.user {
      align-self: flex-end;
      flex-direction: row-reverse;
    }

    .chat-ia-message.assistant {
      align-self: flex-start;
    }

    .message-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }

    .message-bubble {
      padding: 0.75rem 1rem;
      border-radius: 16px;
      max-width: 100%;
      word-wrap: break-word;
    }

    .chat-ia-message.user .message-bubble {
      background: linear-gradient(135deg, #e67e22 0%, #d35400 100%);
      color: white;
      border-bottom-right-radius: 4px;
    }

    .chat-ia-message.assistant .message-bubble {
      background: var(--bg-tertiary, #1f2b47);
      color: var(--text-primary, #e8e8e8);
      border-bottom-left-radius: 4px;
    }

    .message-text {
      margin: 0;
      font-size: 0.95rem;
      line-height: 1.4;
      white-space: pre-wrap;
    }

    .message-time {
      display: block;
      font-size: 0.7rem;
      opacity: 0.6;
      margin-top: 0.35rem;
      text-align: right;
    }

    /* Typing indicator */
    .message-bubble.typing {
      padding: 0.875rem 1.25rem;
    }

    .typing-indicator {
      display: flex;
      gap: 4px;
    }

    .typing-indicator span {
      width: 8px;
      height: 8px;
      background: var(--text-secondary, #aaa);
      border-radius: 50%;
      animation: typing 1.4s infinite ease-in-out;
    }

    .typing-indicator span:nth-child(1) { animation-delay: 0s; }
    .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
    .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

    @keyframes typing {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
      30% { transform: translateY(-6px); opacity: 1; }
    }

    /* Input area */
    .chat-ia-input-area {
      padding: 0.75rem;
      background: var(--bg-primary, #1a1a2e);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      flex-shrink: 0;
      /* Garante que a área de input fique sempre visível */
      position: relative;
      z-index: 10;
    }

    /* Safe area para iPhone X+ */
    @supports (padding: max(0px)) {
      .chat-ia-input-area {
        padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
      }
    }

    /* Quando o teclado está aberto no mobile, garante visibilidade */
    @media (max-width: 768px) {
      .chat-ia-input-area {
        /* Padding extra no bottom para compensar keyboards virtuais */
        padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
      }
    }

    .input-wrapper {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      width: 100%;
    }

    .chat-ia-input {
      flex: 1;
      min-width: 0;
      background: var(--bg-secondary, #16213e);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 0.625rem 0.875rem;
      color: var(--text-primary, #e8e8e8);
      /* Font size 16px mínimo previne zoom automático no iOS */
      font-size: 1rem;
      font-size: max(1rem, 16px);
      font-family: inherit;
      outline: none;
      transition: border-color 0.2s ease;
      /* Melhora a experiência de digitação no mobile */
      -webkit-appearance: none;
      appearance: none;
    }

    .chat-ia-input:focus {
      border-color: #e67e22;
    }

    .chat-ia-input::placeholder {
      color: var(--text-secondary, #888);
    }

    .chat-ia-input:disabled {
      opacity: 0.6;
    }

    .btn-enviar {
      width: 42px;
      height: 42px;
      min-width: 42px;
      border-radius: 50%;
      background: linear-gradient(135deg, #e67e22 0%, #d35400 100%);
      border: none;
      color: white;
      font-size: 1.125rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease, opacity 0.2s ease;
      flex-shrink: 0;
    }

    .btn-enviar:hover:not(:disabled) {
      transform: scale(1.05);
    }

    .btn-enviar:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .spinner-mini {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Message content wrapper */
    .message-content {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 100%;
    }

    /* Produtos destacados / Cards */
    .produtos-destacados {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }

    .categoria-grupo {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .categoria-titulo {
      margin: 0;
      font-size: 0.85rem;
      font-weight: 600;
      color: #e67e22;
      padding: 0.25rem 0;
      border-bottom: 1px solid rgba(230, 126, 34, 0.3);
    }

    .produto-card {
      display: flex;
      gap: 0.75rem;
      background: var(--bg-tertiary, #1f2b47);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 0.75rem;
      animation: fadeIn 0.3s ease;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .produto-card:hover {
      transform: translateX(4px);
      box-shadow: 0 2px 8px rgba(230, 126, 34, 0.2);
      border-color: rgba(230, 126, 34, 0.4);
    }

    .produto-card:active {
      transform: scale(0.98);
    }

    .produto-card.indisponivel {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .produto-card.indisponivel:hover {
      transform: none;
      box-shadow: none;
    }

    .produto-imagem {
      width: 60px;
      height: 60px;
      border-radius: 8px;
      object-fit: cover;
      flex-shrink: 0;
    }

    .produto-imagem-placeholder {
      width: 60px;
      height: 60px;
      border-radius: 8px;
      background: var(--bg-secondary, #16213e);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .produto-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .produto-nome {
      margin: 0;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-primary, #e8e8e8);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .produto-categoria {
      margin: 0;
      font-size: 0.7rem;
      color: var(--text-secondary, #888);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .produto-descricao {
      margin: 0;
      font-size: 0.75rem;
      color: var(--text-secondary, #aaa);
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .produto-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 0.25rem;
    }

    .produto-preco {
      font-size: 0.95rem;
      font-weight: 700;
      color: #2ecc71;
    }

    .btn-adicionar {
      background: linear-gradient(135deg, #e67e22 0%, #d35400 100%);
      border: none;
      color: white;
      padding: 0.35rem 0.75rem;
      border-radius: 16px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .btn-adicionar:hover {
      transform: scale(1.05);
      box-shadow: 0 2px 8px rgba(230, 126, 34, 0.4);
    }

    .btn-adicionar:active {
      transform: scale(0.98);
    }

    .produto-indisponivel {
      font-size: 0.75rem;
      color: #e74c3c;
      font-weight: 500;
    }

    /* Botão nova conversa na área de input */
    .btn-nova-conversa-input {
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: var(--text-primary, #e8e8e8);
      width: 36px;
      height: 36px;
      min-width: 36px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s ease, transform 0.2s ease;
      flex-shrink: 0;
    }

    .btn-nova-conversa-input:hover {
      background: rgba(230, 126, 34, 0.3);
      transform: scale(1.1);
    }

    .btn-nova-conversa-input:active {
      transform: scale(0.95);
    }

    /* Painel de Histórico */
    .historico-panel {
      position: absolute;
      bottom: 70px;
      left: 0;
      right: 0;
      max-height: 300px;
      background: var(--bg-primary, #1a1a2e);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      flex-direction: column;
      animation: slideUp 0.3s ease;
      z-index: 10;
    }

    @keyframes slideUp {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .historico-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .historico-header h3 {
      margin: 0;
      font-size: 0.9rem;
      color: var(--text-primary, #e8e8e8);
    }

    .btn-fechar-historico {
      background: transparent;
      border: none;
      color: var(--text-secondary, #888);
      font-size: 1rem;
      cursor: pointer;
      padding: 0.25rem;
    }

    .btn-fechar-historico:hover {
      color: var(--text-primary, #e8e8e8);
    }

    .historico-lista {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem;
    }

    .historico-vazio {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      color: var(--text-secondary, #888);
    }

    .historico-vazio span {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .historico-vazio p {
      margin: 0;
      font-size: 0.85rem;
    }

    .historico-item {
      position: relative;
      background: var(--bg-secondary, #16213e);
      border-radius: 8px;
      padding: 0.75rem;
      margin-bottom: 0.5rem;
      cursor: pointer;
      transition: background 0.2s ease, transform 0.2s ease;
    }

    .historico-item:hover {
      background: var(--bg-tertiary, #1f2b47);
      transform: translateX(4px);
    }

    .historico-item-titulo {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-primary, #e8e8e8);
      margin-bottom: 0.25rem;
      padding-right: 2rem;
    }

    .historico-item-preview {
      font-size: 0.75rem;
      color: var(--text-secondary, #aaa);
      margin-bottom: 0.25rem;
    }

    .historico-item-data {
      font-size: 0.7rem;
      color: var(--text-secondary, #888);
    }

    .btn-remover-conversa {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: transparent;
      border: none;
      font-size: 0.85rem;
      cursor: pointer;
      opacity: 0.5;
      transition: opacity 0.2s ease;
    }

    .btn-remover-conversa:hover {
      opacity: 1;
    }

    /* Mobile optimizations */
    @media (max-width: 768px) {
      .chat-ia-header {
        padding-top: max(1rem, env(safe-area-inset-top));
      }

      .chat-ia-messages {
        padding: 0.75rem;
      }

      .chat-ia-message {
        max-width: 90%;
      }

      .message-text {
        font-size: 0.9rem;
      }

      .produto-card {
        padding: 0.625rem;
      }

      .produto-imagem,
      .produto-imagem-placeholder {
        width: 50px;
        height: 50px;
      }

      .produto-nome {
        font-size: 0.85rem;
      }

      .btn-adicionar {
        padding: 0.3rem 0.6rem;
        font-size: 0.7rem;
      }

      .btn-nova-conversa-input,
      .btn-historico {
        width: 34px;
        height: 34px;
        font-size: 0.9rem;
      }

      .historico-panel {
        max-height: 250px;
      }
    }
  `]
})
export class ChatIAFullscreenComponent implements AfterViewChecked {
  // Inputs
  readonly isOpen = input.required<boolean>();
  /** Esconde temporariamente o chat (ex: quando modal de produto abre) */
  readonly isHidden = input<boolean>(false);
  readonly isLoading = input<boolean>(false);
  readonly inputText = input<string>('');
  readonly canSend = input<boolean>(false);
  readonly mensagens = input<MensagemChat[]>([]);
  /** Quantidade de itens no carrinho para exibir badge */
  readonly quantidadeItensCarrinho = input<number>(0);
  /** Flag para disparar animação no carrinho (quando item é adicionado) */
  readonly animarCarrinho = input<boolean>(false);
  /** Lista de conversas anteriores */
  readonly historicoConversas = input<ConversaSalva[]>([]);
  /** Se deve mostrar o painel de histórico */
  readonly mostrarHistorico = input<boolean>(false);

  // Outputs
  readonly onClose = output<void>();
  readonly onSend = output<void>();
  readonly onInputChange = output<string>();
  readonly onNovaConversa = output<void>();
  /** Emitido quando o usuário clica em "Adicionar" em um card de produto */
  readonly onAdicionarProduto = output<ProdutoDestacado>();
  /** Emitido quando o usuário clica no carrinho no header */
  readonly onAbrirCarrinho = output<void>();
  /** Emitido para alternar exibição do histórico */
  readonly onToggleHistorico = output<void>();
  /** Emitido quando o usuário seleciona uma conversa do histórico */
  readonly onCarregarConversa = output<string>();
  /** Emitido quando o usuário remove uma conversa do histórico */
  readonly onRemoverConversa = output<string>();

  @ViewChild('messagesContainer') private readonly messagesContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('chatInput') private readonly chatInput?: ElementRef<HTMLInputElement>;
  @ViewChild('inputArea') private readonly inputArea?: ElementRef<HTMLElement>;

  private shouldScrollToBottom = true;

  constructor() {
    // Auto-scroll quando novas mensagens chegam
    effect(() => {
      this.mensagens(); // Track changes
      this.shouldScrollToBottom = true;
    });

    // Foca no input quando abre
    effect(() => {
      if (this.isOpen()) {
        setTimeout(() => this.focusInput(), 100);
      }
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  formatTime(date: Date): string {
    return FormatoUtil.hora(date);
  }

  formatDate(date: Date): string {
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);

    // Usa fuso horário de Brasília para comparação
    const hojeBrasilia = new Date(hoje.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const ontemBrasilia = new Date(ontem.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const dateBrasilia = new Date(date.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));

    if (dateBrasilia.toDateString() === hojeBrasilia.toDateString()) {
      return `Hoje às ${this.formatTime(date)}`;
    } else if (dateBrasilia.toDateString() === ontemBrasilia.toDateString()) {
      return `Ontem às ${this.formatTime(date)}`;
    } else {
      return FormatoUtil.data(date) + ` às ${this.formatTime(date)}`;
    }
  }

  enviar(): void {
    if (this.canSend()) {
      this.onSend.emit();
    }
  }

  /**
   * Adiciona um produto ao carrinho emitindo evento para o componente pai.
   */
  adicionarAoCarrinho(produto: ProdutoDestacado): void {
    this.onAdicionarProduto.emit(produto);
  }

  fecharAoClicarFora(event: Event): void {
    if ((event.target as HTMLElement).classList.contains('chat-ia-overlay')) {
      this.onClose.emit();
    }
  }

  private scrollToBottom(): void {
    if (this.messagesContainer?.nativeElement) {
      const el = this.messagesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  private focusInput(): void {
    if (this.chatInput?.nativeElement) {
      this.chatInput.nativeElement.focus();
    }
  }

  /**
   * Chamado quando o input recebe foco.
   * Garante que a área de input fique visível quando o teclado virtual abre no mobile.
   */
  onInputFocus(): void {
    // Pequeno delay para aguardar o teclado virtual aparecer
    setTimeout(() => {
      // Scroll das mensagens para o final
      this.scrollToBottom();

      // Garante que a área de input esteja visível usando scrollIntoView
      if (this.inputArea?.nativeElement) {
        this.inputArea.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'end'
        });
      }

      // Fallback: usa window.scrollTo se necessário (para alguns navegadores mobile)
      if (typeof globalThis !== 'undefined' && 'visualViewport' in globalThis) {
        const visualViewport = globalThis.visualViewport;
        if (visualViewport) {
          // Força reflow do layout quando teclado abre
          setTimeout(() => {
            this.scrollToBottom();
          }, 100);
        }
      }
    }, 150);
  }

  /**
   * Agrupa produtos por categoria para exibição organizada.
   */
  agruparPorCategoria(produtos: ProdutoDestacado[]): { nome: string; produtos: ProdutoDestacado[] }[] {
    const grupos = new Map<string, ProdutoDestacado[]>();

    for (const produto of produtos) {
      const categoria = produto.categoria || 'Outros';
      if (!grupos.has(categoria)) {
        grupos.set(categoria, []);
      }
      grupos.get(categoria)!.push(produto);
    }

    return Array.from(grupos.entries()).map(([nome, produtos]) => ({ nome, produtos }));
  }
}
