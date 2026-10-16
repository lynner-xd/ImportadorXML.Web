import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { EmpresaOption } from '../../core/models/relatorio.models';
import { PreviewReplicacao } from '../../core/models/replicacao.models';

/// Substituir o plano apaga as contas que as regras apontam, então "regras sem plano" é a única
/// combinação parcial possível no sentido inverso: não existe trocar o plano e manter as regras.
export type ModoReplicacao = 'plano-regras' | 'so-regras' | 'so-plano';

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
  modo: ModoReplicacao = 'plano-regras';

  // Derivação de campo [(ngModel)] é getter, nunca computed(): signals não enxergam o ngModel.
  get replicarPlano(): boolean { return this.modo !== 'so-regras'; }
  get replicarRegras(): boolean { return this.modo !== 'so-plano'; }

  preview = signal<PreviewReplicacao | null>(null);
  carregandoPreview = signal(false);
  salvando = signal(false);
  successMsg = signal('');
  errorMsg = signal('');

  constructor(private api: ApiService, private confirmService: ConfirmService) {}

  ngOnInit(): void {
    this.api.listarEmpresas().subscribe({ next: e => this.empresas.set(e) });
  }

  onEmpresaChange(): void {
    this.preview.set(null);
    this.successMsg.set('');
    this.errorMsg.set('');
    this.carregandoPreview.set(false); // resposta em voo de um par antigo será descartada e não desliga isto
    if (!this.origemId || !this.destinoId) return;

    // Resposta de um par de empresas que já não é o selecionado é descartada; a requisição
    // do par atual (ainda em voo) é quem desliga o carregando.
    const pedido = `${this.origemId}|${this.destinoId}`;
    const atual = () => pedido === `${this.origemId}|${this.destinoId}`;

    this.carregandoPreview.set(true);
    this.api.previewReplicacao(this.origemId, this.destinoId).subscribe({
      next: p => {
        if (!atual()) return;
        this.preview.set(p);
        this.carregandoPreview.set(false);
      },
      error: err => {
        if (!atual()) return;
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
      && this.bloqueios().length === 0;
  }

  nomeEmpresa(id: string): string {
    return this.empresas().find(e => e.id === id)?.razaoSocial ?? '';
  }

  async replicar(): Promise<void> {
    if (!this.podeReplicar()) return;

    const alvo = this.nomeEmpresa(this.destinoId);
    const fonte = this.nomeEmpresa(this.origemId);
    const modo = this.modo;
    const mensagem = modo === 'so-plano'
      ? `Substituir o plano de contas de ${alvo} pelo de ${fonte}? As regras de importação e as contas padrão de ${alvo} serão apagadas junto com o plano antigo e não serão substituídas.`
      : modo === 'so-regras'
        ? `Substituir as regras de importação e as contas padrão de ${alvo} pelas de ${fonte}? O que existe hoje em ${alvo} será apagado.`
        : `Substituir o plano de contas, as regras de importação e as contas padrão de ${alvo} pela configuração de ${fonte}? O que existe hoje em ${alvo} será apagado.`;

    const confirmado = await this.confirmService.confirmar({
      mensagem,
      textoConfirmar: 'Replicar',
      perigo: true
    });
    if (!confirmado) return;

    this.salvando.set(true);
    this.api.replicarConfiguracao(this.origemId, this.destinoId, this.replicarPlano, this.replicarRegras).subscribe({
      next: r => {
        this.salvando.set(false);
        this.onEmpresaChange(); // limpa as mensagens e recarrega o resumo; a de sucesso vem depois
        this.successMsg.set(
          modo === 'so-plano'
            ? `Replicado: ${r.contasCopiadas} contas. ${alvo} ficou sem regras de importação.`
            : modo === 'so-regras'
              ? `Replicado: ${r.regrasCopiadas} regras.`
              : `Replicado: ${r.contasCopiadas} contas e ${r.regrasCopiadas} regras.`);
      },
      error: err => {
        this.salvando.set(false);
        this.onEmpresaChange(); // o resumo antigo pode já não valer (ex.: lançamento gravado no destino)
        this.errorMsg.set(err.error?.message || 'Erro ao replicar a configuração.');
      }
    });
  }
}
