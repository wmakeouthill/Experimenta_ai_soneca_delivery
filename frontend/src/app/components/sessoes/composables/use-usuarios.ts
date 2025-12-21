import { inject } from '@angular/core';
import { signal, computed } from '@angular/core';
import { AuthService, UsuarioDTO } from '../../../services/auth.service';

/**
 * Composable para gerenciamento de usuários.
 * Centraliza a lógica de carregamento e mapeamento de usuários.
 * Segue Clean Code e Single Responsibility Principle.
 */
export function useUsuarios() {
  const authService = inject(AuthService);

  // Estados - usando signal para garantir reatividade
  const usuarios = signal<UsuarioDTO[]>([]);
  const carregando = signal<boolean>(false);
  const erro = signal<string | null>(null);

  // Computed - mapa reativo de usuários
  const usuariosMap = computed(() => {
    const map = new Map<string, string>();
    usuarios().forEach(usuario => {
      map.set(usuario.id, usuario.nome);
    });
    return map;
  });

  // Métodos
  const carregarUsuarios = () => {
    carregando.set(true);
    erro.set(null);

    authService.listarUsuarios().subscribe({
      next: (usuariosCarregados) => {
        usuarios.set(usuariosCarregados);
        carregando.set(false);
      },
      error: (error) => {
        erro.set(error.error?.message || 'Erro ao carregar usuários');
        carregando.set(false);
        usuarios.set([]); // Limpar em caso de erro
      }
    });
  };

  const obterNomeUsuario = (usuarioId: string): string => {
    const map = usuariosMap();
    return map.get(usuarioId) || usuarioId;
  };

  return {
    carregando,
    erro,
    usuarios,
    carregarUsuarios,
    obterNomeUsuario
  };
}

