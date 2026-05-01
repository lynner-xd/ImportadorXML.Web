import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  email = '';
  senha = '';
  loading = signal(false);
  error = signal('');

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit(): void {
    if (!this.email || !this.senha) {
      this.error.set('Preencha todos os campos.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.auth.login({ email: this.email, senha: this.senha }).subscribe({
      next: () => {
        if (this.auth.primeiroAcesso()) {
          this.router.navigate(['/alterar-senha']);
        } else {
          this.router.navigate(['/home']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Credenciais inválidas.');
      }
    });
  }
}
