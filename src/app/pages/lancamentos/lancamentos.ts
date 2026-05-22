import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { LancamentoResponse, CriarLancamentoRequest, AtualizarLancamentoRequest } from '../../core/models/lancamento.models';
import { PlanoContaResponse } from '../../core/models/plano-conta.models';

@Component({
  selector: 'app-lancamentos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lancamentos.html',
  styleUrl: './lancamentos.scss'
})
export class LancamentosComponent implements OnInit {
  lancamentos = signal<LancamentoResponse[]>([]);
  contas = signal<PlanoContaResponse[]>([]);
  loading = signal(false);
  showDialog = signal(false);
  error = signal('');
  lancamentoEditandoId = signal<string | null>(null);
  modoEdicao = computed(() => this.lancamentoEditandoId() !== null);

  form: CriarLancamentoRequest = {
    data: new Date().toISOString().split('T')[0],
    descricao: '',
    observacao: '',
    contaDebitoId: '',
    contaCreditoId: '',
    valor: 0
  };

  valorFormatado = '';

  filtroDataInicio = '';
  filtroDataFim = '';
  filtroDebito = '';
  filtroCredito = '';

  get lancamentosFiltrados(): LancamentoResponse[] {
    return this.lancamentos()
      .filter(l => {
        const data = l.data.substring(0, 10);
        if (this.filtroDataInicio && data < this.filtroDataInicio) return false;
        if (this.filtroDataFim && data > this.filtroDataFim) return false;
        if (this.filtroDebito && !l.contaDebito.toLowerCase().includes(this.filtroDebito.toLowerCase())) return false;
        if (this.filtroCredito && !l.contaCredito.toLowerCase().includes(this.filtroCredito.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => b.data.localeCompare(a.data));
  }

  get temFiltroAtivo(): boolean {
    return !!(this.filtroDataInicio || this.filtroDataFim || this.filtroDebito || this.filtroCredito);
  }

  limparFiltros(): void {
    this.filtroDataInicio = '';
    this.filtroDataFim = '';
    this.filtroDebito = '';
    this.filtroCredito = '';
  }

  constructor(private api: ApiService) {}

  onValorInput(value: string): void {
    const apenasNumeros = value.replace(/\D/g, '');
    const centavos = parseInt(apenasNumeros || '0', 10);
    this.form.valor = centavos / 100;
    this.valorFormatado = this.formatarMoeda(centavos);
  }

  private formatarMoeda(centavos: number): string {
    if (centavos === 0) return '';
    const reais = Math.floor(centavos / 100);
    const cents = centavos % 100;
    const reaisStr = reais.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${reaisStr},${cents.toString().padStart(2, '0')}`;
  }

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    this.loading.set(true);
    this.api.listarLancamentos().subscribe({
      next: (data) => { this.lancamentos.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
    this.api.listarPlanoContas().subscribe({
      next: (data) => this.contas.set(data)
    });
  }

  abrirDialog(): void {
    this.lancamentoEditandoId.set(null);
    this.form = {
      data: new Date().toISOString().split('T')[0],
      descricao: '',
      contaDebitoId: '',
      contaCreditoId: '',
      valor: 0
    };
    this.valorFormatado = '';
    this.error.set('');
    this.showDialog.set(true);
  }

  abrirDialogEdicao(l: LancamentoResponse): void {
    this.lancamentoEditandoId.set(l.id);
    this.form = {
      data: l.data.substring(0, 10),
      descricao: l.descricao ?? '',
      observacao: l.observacao ?? '',
      contaDebitoId: l.contaDebitoId,
      contaCreditoId: l.contaCreditoId,
      valor: l.valor
    };
    const centavos = Math.round(l.valor * 100);
    this.valorFormatado = this.formatarMoeda(centavos);
    this.error.set('');
    this.showDialog.set(true);
  }

  fecharDialog(): void {
    this.showDialog.set(false);
    this.lancamentoEditandoId.set(null);
  }

  salvar(): void {
    if (!this.form.descricao || !this.form.contaDebitoId || !this.form.contaCreditoId || this.form.valor <= 0) {
      this.error.set('Preencha todos os campos corretamente.');
      return;
    }

    const editandoId = this.lancamentoEditandoId();
    const obs$ = editandoId
      ? this.api.atualizarLancamento(editandoId, this.form as AtualizarLancamentoRequest)
      : this.api.criarLancamento(this.form);

    obs$.subscribe({
      next: () => {
        this.fecharDialog();
        this.carregarDados();
      },
      error: (err) => this.error.set(err.error?.message || (editandoId ? 'Erro ao atualizar lançamento.' : 'Erro ao criar lançamento.'))
    });
  }

  excluir(id: string): void {
    if (confirm('Deseja excluir este lançamento?')) {
      this.api.excluirLancamento(id).subscribe({
        next: () => this.carregarDados()
      });
    }
  }

  contasAnaliticas(): PlanoContaResponse[] {
    return this.contas().filter(c => c.codigo.split('.').length === 5);
  }
}
