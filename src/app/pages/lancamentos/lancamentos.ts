import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { LancamentoResponse, CriarLancamentoRequest } from '../../core/models/lancamento.models';
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

  form: CriarLancamentoRequest = {
    data: new Date().toISOString().split('T')[0],
    descricao: '',
    observacao: '',
    contaDebitoId: '',
    contaCreditoId: '',
    valor: 0
  };

  valorFormatado = '';

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

  salvar(): void {
    if (!this.form.descricao || !this.form.contaDebitoId || !this.form.contaCreditoId || this.form.valor <= 0) {
      this.error.set('Preencha todos os campos corretamente.');
      return;
    }

    this.api.criarLancamento(this.form).subscribe({
      next: () => {
        this.showDialog.set(false);
        this.carregarDados();
      },
      error: (err) => this.error.set(err.error?.message || 'Erro ao criar lançamento.')
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
    return this.contas().filter(c => c.codigo.split('.').length === 4);
  }
}
