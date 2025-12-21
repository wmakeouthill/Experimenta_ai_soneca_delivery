import { signal, computed, inject, PLATFORM_ID, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PedidoMesaService } from '../../../services/pedido-mesa.service';
import { ClienteAuthService } from '../../../services/cliente-auth.service';
import { Subscription } from 'rxjs';

const CLIENTE_STORAGE_KEY = 'pedido-mesa-cliente';

export interface ClienteIdentificado {
    id: string;
    nome: string;
    telefone: string;
    novoCliente: boolean;
    fotoUrl?: string;
    temSenha?: boolean;
}

type EtapaIdentificacao = 'identificacao' | 'cadastro';

/**
 * Composable para gerenciar a identificação e cadastro de clientes.
 * Responsabilidade única: fluxo de identificação do cliente.
 */
export function useIdentificacaoCliente(mesaToken: () => string | undefined) {
    const pedidoMesaService = inject(PedidoMesaService);
    const clienteAuthService = inject(ClienteAuthService);
    const platformId = inject(PLATFORM_ID);
    const isBrowser = isPlatformBrowser(platformId);

    // Estado interno
    const _telefoneInput = signal('');
    const _nomeInput = signal('');
    const etapa = signal<EtapaIdentificacao>('identificacao');
    const buscando = signal(false);
    const clienteIdentificado = signal<ClienteIdentificado | null>(restaurarCliente());
    const erro = signal<string | null>(null);

    // Subscription para escutar mudanças no ClienteAuthService
    let clienteLogadoSub: Subscription | null = null;

    // ✅ Inicializa escuta de mudanças no cliente logado APÓS hidratação
    // Atrasa para evitar problemas de hidratação (NG0506)
    if (isBrowser) {
        // Aguarda a aplicação se tornar estável antes de iniciar subscription
        setTimeout(() => {
            clienteLogadoSub = clienteAuthService.clienteLogado$.subscribe(clienteLogado => {
                if (clienteLogado) {
                    // Atualiza cliente identificado quando login Google/senha é restaurado
                    const clienteData: ClienteIdentificado = {
                        id: clienteLogado.id,
                        nome: clienteLogado.nome,
                        telefone: clienteLogado.telefone || '',
                        novoCliente: false,
                        fotoUrl: clienteLogado.fotoUrl
                    };
                    clienteIdentificado.set(clienteData);
                }
            });
        }, 100); // Delay de 100ms após inicialização
    }

    /**
     * Restaura cliente do sessionStorage ou do ClienteAuthService
     */
    function restaurarCliente(): ClienteIdentificado | null {
        if (!isBrowser) return null;

        // Primeiro tenta restaurar do ClienteAuthService (login Google/senha)
        const clienteLogado = clienteAuthService.clienteLogado;
        if (clienteLogado) {
            return {
                id: clienteLogado.id,
                nome: clienteLogado.nome,
                telefone: clienteLogado.telefone || '',
                novoCliente: false,
                fotoUrl: clienteLogado.fotoUrl
            };
        }

        // Se não tem login, tenta restaurar do sessionStorage (identificação por telefone)
        try {
            const stored = sessionStorage.getItem(CLIENTE_STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored) as ClienteIdentificado;
            }
        } catch {
            // Ignora erros de parse
        }

        return null;
    }

    /**
     * Limpa subscription ao destruir
     */
    function destroy(): void {
        clienteLogadoSub?.unsubscribe();
        clienteLogadoSub = null;
    }

    /**
     * Persiste cliente no sessionStorage
     */
    function persistirCliente(cliente: ClienteIdentificado): void {
        if (!isBrowser) return;
        try {
            sessionStorage.setItem(CLIENTE_STORAGE_KEY, JSON.stringify(cliente));
        } catch {
            // Ignora erros de storage
        }
    }

    /**
     * Limpa cliente do sessionStorage
     */
    function limparClientePersistido(): void {
        if (!isBrowser) return;
        try {
            sessionStorage.removeItem(CLIENTE_STORAGE_KEY);
        } catch {
            // Ignora erros
        }
    }

    // Computed para validações
    const telefoneValido = computed(() => {
        const numeros = _telefoneInput().replace(/\D/g, '');
        return numeros.length >= 10 && numeros.length <= 11;
    });

    const nomeValido = computed(() => _nomeInput().trim().length >= 2);

    const podeBuscar = computed(() => telefoneValido() && !buscando());
    const podeCadastrar = computed(() => telefoneValido() && nomeValido() && !buscando());

    // Formatação
    function formatarTelefoneInput(numeros: string): string {
        if (numeros.length === 0) return '';
        if (numeros.length <= 2) return `(${numeros}`;
        if (numeros.length <= 6) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
        if (numeros.length <= 10) return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
        return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
    }

    function formatarTelefone(telefone: string): string {
        const numeros = telefone.replace(/\D/g, '');
        if (numeros.length === 11) {
            return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
        }
        if (numeros.length === 10) {
            return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
        }
        return telefone;
    }

    // Getters/Setters para binding
    function getTelefone(): string {
        return _telefoneInput();
    }

    function setTelefone(value: string): void {
        const numeros = value.replace(/\D/g, '').slice(0, 11);
        _telefoneInput.set(formatarTelefoneInput(numeros));
    }

    function getNome(): string {
        return _nomeInput();
    }

    function setNome(value: string): void {
        _nomeInput.set(value);
    }

    // Ações
    function buscarCliente(onSucesso: () => void): void {
        if (!podeBuscar()) return;

        const token = mesaToken();
        if (!token) return;

        const telefone = _telefoneInput().replace(/\D/g, '');
        buscando.set(true);
        erro.set(null);

        pedidoMesaService.buscarClientePorTelefone(token, telefone).subscribe({
            next: (cliente) => {
                buscando.set(false);
                const clienteData: ClienteIdentificado = {
                    id: cliente.id,
                    nome: cliente.nome,
                    telefone: cliente.telefone,
                    novoCliente: false,
                    fotoUrl: cliente.fotoUrl
                };
                clienteIdentificado.set(clienteData);
                persistirCliente(clienteData);
                onSucesso();
            },
            error: (err) => {
                buscando.set(false);
                if (err.status === 404) {
                    etapa.set('cadastro');
                } else {
                    erro.set('Erro ao buscar cliente. Tente novamente.');
                }
            }
        });
    }

    function cadastrarCliente(onSucesso: () => void): void {
        if (!podeCadastrar()) return;

        const token = mesaToken();
        if (!token) return;

        const telefone = _telefoneInput().replace(/\D/g, '');
        const nome = _nomeInput().trim();
        buscando.set(true);
        erro.set(null);

        pedidoMesaService.cadastrarCliente(token, { nome, telefone }).subscribe({
            next: (cliente) => {
                buscando.set(false);
                const clienteData: ClienteIdentificado = {
                    id: cliente.id,
                    nome: cliente.nome,
                    telefone: cliente.telefone,
                    novoCliente: true,
                    fotoUrl: cliente.fotoUrl
                };
                clienteIdentificado.set(clienteData);
                persistirCliente(clienteData);
                onSucesso();
            },
            error: () => {
                buscando.set(false);
                erro.set('Erro ao cadastrar. Tente novamente.');
            }
        });
    }

    function voltarParaIdentificacao(): void {
        etapa.set('identificacao');
        _nomeInput.set('');
        erro.set(null);
    }

    function trocarCliente(): void {
        clienteIdentificado.set(null);
        limparClientePersistido();
        clienteAuthService.logout(); // Também faz logout do ClienteAuthService
        _telefoneInput.set('');
        _nomeInput.set('');
        etapa.set('identificacao');
    }

    /**
     * Define o cliente identificado a partir dos dados do login Google.
     * Usado quando o cliente faz login via Google OAuth.
     * Nota: O ClienteAuthService já persiste no localStorage automaticamente.
     */
    function setClienteFromGoogle(cliente: { id: string; nome: string; telefone: string; fotoUrl?: string }): void {
        const clienteData: ClienteIdentificado = {
            id: cliente.id,
            nome: cliente.nome,
            telefone: cliente.telefone || '',
            novoCliente: false,
            fotoUrl: cliente.fotoUrl
        };
        clienteIdentificado.set(clienteData);
        // Não precisa persistir aqui, o ClienteAuthService já faz isso
    }

    function atualizarTemSenha(temSenha: boolean): void {
        const cliente = clienteIdentificado();
        if (cliente) {
            clienteIdentificado.set({ ...cliente, temSenha });
            persistirCliente({ ...cliente, temSenha });
        }
    }

    return {
        // Estado
        etapa: etapa.asReadonly(),
        buscando: buscando.asReadonly(),
        clienteIdentificado: clienteIdentificado.asReadonly(),
        erro: erro.asReadonly(),

        // Computed
        telefoneValido,
        nomeValido,
        podeBuscar,
        podeCadastrar,

        // Getters/Setters
        getTelefone,
        setTelefone,
        getNome,
        setNome,

        // Ações
        buscarCliente,
        cadastrarCliente,
        voltarParaIdentificacao,
        trocarCliente,
        setClienteFromGoogle,
        atualizarTemSenha,
        destroy,

        // Utilitários
        formatarTelefone
    };
}
