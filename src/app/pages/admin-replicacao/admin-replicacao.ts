import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { EmpresaOption } from '../../core/models/relatorio.models';
import { PreviewReplicacao } from '../../core/models/replicacao.models';

@Component({
  selector: 'app-admin-replicacao',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-replicacao.html',
  styleUrl: './admin-replicacao.scss'
})
export class AdminReplicacaoComponent implements OnInit {
  empresas = signal<EmpresaOption[]>([]);
  origemId = '';
  destinoId = '';
  replicarPlano = true;
  replicarRegras = true;

  preview = signal<PreviewReplicacao | null>(null);
  carregandoPreview = signal(false);
  salvando = signal(false);
  successMsg = signal('');
  errorMsg = signal('');

  constructor(private api: ApiService, private confirmService: ConfirmService) {}

  ngOnInit(): void {
    this.api.listarEmpresas().subscribe({ next: e => this.empresas.set(e) });
  }

  // Trocar o plano apaga as contas que as regras apontam: o plano arrasta as regras.
  onPlanoChange(): void {
    if (this.replicarPlano) this.replicarRegras = true;
  }

  onEmpresaChange(): void {
    this.preview.set(null);
    this.successMsg.set('');
    this.errorMsg.set('');
    if (!this.origemId || !this.destinoId) return;

    this.carregandoPreview.set(true);
    this.api.previewReplicacao(this.origemId, this.destinoId).subscribe({
      next: p => { this.preview.set(p); this.carregandoPreview.set(false); },
      error: err => {
        this.carregandoPreview.set(false);
        this.errorMsg.set(err.error?.message || 'Erro ao carregar a prévia.');
      }
    });
  }

  bloqueios(): string[] {
    const p = this.preview();
    if (!p) return [];
    return this.replicarPlano ? p.bloqueiosPlano : p.bloqueiosRegras;
  }

  podeReplicar(): boolean {
    return !!this.preview()
      && !this.salvando()
      && (this.replicarPlano || this.replicarRegras)
      && this.bloqueios().length === 0;
  }

  nomeEmpresa(id: string): string {
    return this.empresas().find(e => e.id === id)?.razaoSocial ?? '';
  }

  async replicar(): Promise<void> {
    if (!this.podeReplicar()) return;

    const alvo = this.nomeEmpresa(this.destinoId);
    const oque = this.replicarPlano
      ? 'o plano de contas e as regras de importação'
      : 'as regras de importação';
    const confirmado = await this.confirmService.confirmar({
      mensagem: `Substituir ${oque} de ${alvo} pela configuração de ${this.nomeEmpresa(this.origemId)}? O que existe hoje em ${alvo} será apagado.`,
      textoConfirmar: 'Replicar',
      perigo: true
    });
    if (!confirmado) return;

    this.salvando.set(true);
    this.api.replicarConfiguracao(this.origemId, this.destinoId, this.replicarPlano, this.replicarRegras).subscribe({
      next: r => {
        this.salvando.set(false);
        this.onEmpresaChange(); // limpa as mensagens e recarrega o resumo; a de sucesso vem depois
        this.successMsg.set(this.replicarPlano
          ? `Replicado: ${r.contasCopiadas} contas e ${r.regrasCopiadas} regras.`
          : `Replicado: ${r.regrasCopiadas} regras.`);
      },
      error: err => {
        this.salvando.set(false);
        this.errorMsg.set(err.error?.message || 'Erro ao replicar a configuração.');
      }
    });
  }
}
