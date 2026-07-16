import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { IntegracaoEmpresaResponse } from '../../core/models/integracao.models';

@Component({
  selector: 'app-admin-integracao',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-integracao.html',
  styleUrl: './admin-integracao.scss'
})
export class AdminIntegracaoComponent implements OnInit {
  empresas = signal<IntegracaoEmpresaResponse[]>([]);
  loading = signal(false);
  successMsg = signal('');
  errorMsg = signal('');
  showChaveDialog = signal(false);
  chaveGerada = signal('');
  empresaChave = signal('');
  chaveCopiada = signal(false);

  constructor(private api: ApiService, private confirmService: ConfirmService) {}

  ngOnInit(): void { this.carregar(); }

  carregar(): void {
    this.loading.set(true);
    this.api.listarIntegracao().subscribe({
      next: (data) => { this.empresas.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  async gerar(e: IntegracaoEmpresaResponse): Promise<void> {
    const msg = e.possuiToken
      ? `Gerar um novo token para ${e.razaoSocial}? O token atual deixará de funcionar imediatamente.`
      : `Gerar token de integração para ${e.razaoSocial}?`;
    if (!(await this.confirmService.confirmar({ mensagem: msg, textoConfirmar: 'Gerar' }))) return;

    this.api.gerarTokenIntegracao(e.empresaId).subscribe({
      next: (res) => {
        this.chaveGerada.set(res.chave);
        this.empresaChave.set(e.razaoSocial);
        this.chaveCopiada.set(false);
        this.showChaveDialog.set(true);
        this.carregar();
      },
      error: (err) => this.showError(err.error?.message || 'Erro ao gerar token.')
    });
  }

  async alterarStatus(e: IntegracaoEmpresaResponse): Promise<void> {
    const novoStatus = !e.tokenAtivo;
    const acao = novoStatus ? 'ativar' : 'inativar';
    if (!(await this.confirmService.confirmar({ mensagem: `Deseja ${acao} o token de ${e.razaoSocial}?` }))) return;

    this.api.alterarStatusTokenIntegracao(e.empresaId, novoStatus).subscribe({
      next: () => {
        this.carregar();
        this.showSuccess(`Token ${novoStatus ? 'ativado' : 'inativado'} com sucesso.`);
      },
      error: (err) => this.showError(err.error?.message || 'Erro ao alterar status.')
    });
  }

  copiarChave(): void {
    navigator.clipboard.writeText(this.chaveGerada()).then(() => {
      this.chaveCopiada.set(true);
      setTimeout(() => this.chaveCopiada.set(false), 2500);
    });
  }

  fecharDialog(): void {
    this.showChaveDialog.set(false);
    this.chaveGerada.set('');
  }

  private showSuccess(msg: string): void {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(''), 4000);
  }

  private showError(msg: string): void {
    this.errorMsg.set(msg);
    setTimeout(() => this.errorMsg.set(''), 4000);
  }
}
