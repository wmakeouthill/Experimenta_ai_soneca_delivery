import { Component, inject, signal, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, UsuarioDTO, CriarUsuarioRequest, AtualizarUsuarioRequest } from '../../services/auth.service';
import { ConfigImpressoraComponent } from './components/config-impressora/config-impressora.component';

@Component({
  selector: 'app-administracao',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, ConfigImpressoraComponent],
  templateUrl: './administracao.component.html',
  styleUrl: './administracao.component.css'
})
export class AdministracaoComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly platformId = inject(PLATFORM_ID);

  readonly usuarios = signal<UsuarioDTO[]>([]);
  readonly estaCarregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly mostrarModal = signal(false);
  readonly usuarioEditando = signal<UsuarioDTO | null>(null);
  readonly linkCopiado = signal(false);
  readonly form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      role: ['OPERADOR', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.carregarUsuarios();
  }

  carregarUsuarios(): void {
    this.estaCarregando.set(true);
    this.erro.set(null);

    this.authService.listarUsuarios().subscribe({
      next: (usuarios) => {
        this.usuarios.set(usuarios);
        this.estaCarregando.set(false);
      },
      error: (error) => {
        this.erro.set('Erro ao carregar usuários. Tente novamente.');
        this.estaCarregando.set(false);
        console.error('Erro:', error);
      }
    });
  }

  abrirModalCriar(): void {
    this.usuarioEditando.set(null);
    this.form.reset({
      nome: '',
      email: '',
      senha: '',
      role: 'OPERADOR'
    });
    this.mostrarModal.set(true);
  }

  abrirModalEditar(usuario: UsuarioDTO): void {
    this.usuarioEditando.set(usuario);
    this.form.patchValue({
      nome: usuario.nome,
      email: usuario.email,
      senha: '',
      role: usuario.role
    });
    this.form.get('senha')?.clearValidators();
    this.form.get('senha')?.updateValueAndValidity();
    this.mostrarModal.set(true);
  }

  fecharModal(): void {
    this.mostrarModal.set(false);
    this.usuarioEditando.set(null);
    this.form.reset();
    this.form.get('senha')?.setValidators([Validators.required, Validators.minLength(6)]);
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const usuarioEditando = this.usuarioEditando();
    const formValue = this.form.value;

    if (usuarioEditando) {
      const request: AtualizarUsuarioRequest = {
        nome: formValue.nome,
        role: formValue.role,
        ativo: undefined
      };

      this.authService.atualizarUsuario(usuarioEditando.id, request).subscribe({
        next: () => {
          this.carregarUsuarios();
          this.fecharModal();
        },
        error: (error) => {
          this.erro.set(error.error?.message || 'Erro ao atualizar usuário.');
          console.error('Erro:', error);
        }
      });
    } else {
      const request: CriarUsuarioRequest = {
        nome: formValue.nome,
        email: formValue.email,
        senha: formValue.senha,
        role: formValue.role
      };

      this.authService.criarUsuario(request).subscribe({
        next: () => {
          this.carregarUsuarios();
          this.fecharModal();
        },
        error: (error) => {
          this.erro.set(error.error?.message || 'Erro ao criar usuário.');
          console.error('Erro:', error);
        }
      });
    }
  }

  excluirUsuario(id: string): void {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) {
      return;
    }

    this.authService.excluirUsuario(id).subscribe({
      next: () => {
        this.carregarUsuarios();
      },
      error: (error) => {
        this.erro.set('Erro ao excluir usuário.');
        console.error('Erro:', error);
      }
    });
  }

  alternarStatus(usuario: UsuarioDTO): void {
    const request: AtualizarUsuarioRequest = {
      ativo: !usuario.ativo
    };

    this.authService.atualizarUsuario(usuario.id, request).subscribe({
      next: () => {
        this.carregarUsuarios();
      },
      error: (error) => {
        this.erro.set('Erro ao alterar status do usuário.');
        console.error('Erro:', error);
      }
    });
  }

  get nome() {
    return this.form.get('nome');
  }

  get email() {
    return this.form.get('email');
  }

  get senha() {
    return this.form.get('senha');
  }

  get role() {
    return this.form.get('role');
  }

  isEditando(): boolean {
    return this.usuarioEditando() !== null;
  }

  copiarLinkDelivery(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const baseUrl = window.location.origin;
    const linkDelivery = `${baseUrl}/delivery`;

    navigator.clipboard.writeText(linkDelivery).then(() => {
      this.linkCopiado.set(true);
      setTimeout(() => this.linkCopiado.set(false), 2000);
    }).catch(err => {
      console.error('Erro ao copiar link:', err);
      this.erro.set('Erro ao copiar link. Tente manualmente.');
    });
  }
}

