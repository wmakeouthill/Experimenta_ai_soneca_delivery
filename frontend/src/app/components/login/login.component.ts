import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly form: FormGroup;
  readonly estaCarregando = signal(false);
  readonly erro = signal<string | null>(null);

  constructor() {
    this.form = this.fb.group({
      emailOuUsuario: ['', [Validators.required]],
      senha: ['', [Validators.required, Validators.minLength(6)]]
    });

    if (this.authService.estaAutenticado()) {
      this.router.navigate(['/']);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.estaCarregando.set(true);
    this.erro.set(null);

    const credenciais = {
      emailOuUsuario: this.form.value.emailOuUsuario,
      senha: this.form.value.senha
    };

    this.authService.login(credenciais).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
        this.router.navigate([returnUrl]);
      },
      error: (error) => {
        this.erro.set(error.error?.message || 'Erro ao fazer login. Verifique suas credenciais.');
        this.estaCarregando.set(false);
      }
    });
  }

  get emailOuUsuario() {
    return this.form.get('emailOuUsuario');
  }

  get senha() {
    return this.form.get('senha');
  }
}

