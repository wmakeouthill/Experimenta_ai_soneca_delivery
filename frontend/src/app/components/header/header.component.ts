import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  private readonly authService = inject(AuthService);
  
  readonly usuarioAtual = this.authService.usuarioAtual;
  readonly estaAutenticado = this.authService.estaAutenticado;
  readonly isAdministrador = this.authService.isAdministrador;

  logout(): void {
    this.authService.logout();
  }
}

