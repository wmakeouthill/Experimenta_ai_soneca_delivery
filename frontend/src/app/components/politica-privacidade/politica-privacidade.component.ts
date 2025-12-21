import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-politica-privacidade',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './politica-privacidade.component.html',
  styleUrl: './politica-privacidade.component.css'
})
export class PoliticaPrivacidadeComponent {
  readonly dataAtualizacao = '05 de dezembro de 2025';
  readonly nomeAplicativo = 'Experimenta aí do Soneca';
  readonly emailContato = 'wcacorreia1995@gmail.com';
}
