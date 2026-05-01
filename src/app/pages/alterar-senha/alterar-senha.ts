import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-alterar-senha',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alterar-senha.html',
  styleUrl: './alterar-senha.scss'
})
export class AlterarSenhaComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  senhaAtual = '';
  novaSenha = '';
  confirmarSenha = '';
  loading = signal(false);
  error = signal('');
  success = signal(false);

  readonly isPrimeiroAcesso = this.auth.primeiroAcesso;

  alterar(): void {
    if (!this.senhaAtual || !this.novaSenha || !this.confirmarSenha) {
      this.error.set('Preencha todos os campos.');
      return;
    }
    if (this.novaSenha !== this.confirmarSenha) {
      this.error.set('A nova senha e a confirmação não coincidem.');
      return;
    }
    if (this.novaSenha.length < 6) {
      this.error.set('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.auth.alterarSenha({ senhaAtual: this.senhaAtual, novaSenha: this.novaSenha }).subscribe({
      next: () => {
        this.auth.marcarSenhaAlterada();
        this.loading.set(false);
        this.success.set(true);
        setTimeout(() => this.router.navigate(['/home']), 2000);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Erro ao alterar senha.');
      }
    });
  }
}
