import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ConfiguracaoEmailRequest, ConfiguracaoEmailResponse } from '../../core/models/email-config.models';

@Component({
  selector: 'app-admin-email',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-email.html',
  styleUrl: './admin-email.scss'
})
export class AdminEmailComponent implements OnInit {
  config = signal<ConfiguracaoEmailResponse | null>(null);
  loading = signal(false);
  saving = signal(false);
  testing = signal(false);
  error = signal('');
  successMsg = signal('');

  form: ConfiguracaoEmailRequest = {
    servidorSmtp: '',
    porta: 587,
    usarSsl: true,
    emailRemetente: '',
    senhaRemetente: '',
    nomeRemetente: ''
  };

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.loading.set(true);
    this.api.obterConfiguracaoEmail().subscribe({
      next: (data) => {
        this.config.set(data);
        if (data.configurado) {
          this.form = {
            servidorSmtp: data.servidorSmtp,
            porta: data.porta,
            usarSsl: data.usarSsl,
            emailRemetente: data.emailRemetente,
            senhaRemetente: '',
            nomeRemetente: data.nomeRemetente
          };
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  salvar(): void {
    if (!this.form.servidorSmtp || !this.form.emailRemetente) {
      this.error.set('Preencha os campos obrigatórios.');
      return;
    }
    if (!this.config()?.configurado && !this.form.senhaRemetente) {
      this.error.set('Senha do remetente é obrigatória na primeira configuração.');
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.api.salvarConfiguracaoEmail(this.form).subscribe({
      next: () => {
        this.saving.set(false);
        this.showSuccess('Configuração salva com sucesso.');
        this.carregar();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.message || 'Erro ao salvar configuração.');
      }
    });
  }

  testar(): void {
    this.testing.set(true);
    this.error.set('');
    this.api.testarEmail().subscribe({
      next: () => {
        this.testing.set(false);
        this.showSuccess('Email de teste enviado com sucesso!');
      },
      error: (err) => {
        this.testing.set(false);
        this.error.set(err.error?.message || 'Falha ao enviar email de teste.');
      }
    });
  }

  private showSuccess(msg: string): void {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(''), 4000);
  }
}
