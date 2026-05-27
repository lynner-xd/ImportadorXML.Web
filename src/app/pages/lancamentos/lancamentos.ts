import { Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
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
export class LancamentosComponent implements OnInit, OnDestroy {
  lancamentos = signal<LancamentoResponse[]>([]);
  contas = signal<PlanoContaResponse[]>([]);
  loading = signal(false);
  showDialog = signal(false);
  error = signal('');
  lancamentoEditandoId = signal<string | null>(null);
  modoEdicao = computed(() => this.lancamentoEditandoId() !== null);

  // Paginação
  pagina = signal(1);
  readonly pageSize = 50;
  totalLancamentos = signal(0);
  totalPaginas = computed(() => Math.max(1, Math.ceil(this.totalLancamentos() / this.pageSize)));

  // Autocomplete descrição
  descricoesSalvas = signal<string[]>([]);
  mostrarSugestoes = signal(false);

  sugestoesFiltradas(): string[] {
    return this.filtrarDescricoes(this.form.descricao, this.descricoesSalvas());
  }

  @ViewChild('valorInput') valorInputRef?: ElementRef<HTMLInputElement>;

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

  private filtroTexto$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.filtroTexto$
      .pipe(debounceTime(400), takeUntil(this.destroy$))
      .subscribe(() => this.aoMudarFiltro());

    this.carregarPagina();
    this.carregarDescricoes();
    this.api.listarPlanoContas().subscribe({
      next: (data) => this.contas.set(data)
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get temFiltroAtivo(): boolean {
    return !!(this.filtroDataInicio || this.filtroDataFim || this.filtroDebito || this.filtroCredito);
  }

  carregarPagina(): void {
    this.loading.set(true);
    this.api.listarLancamentos({
      page: this.pagina(),
      pageSize: this.pageSize,
      dataInicio: this.filtroDataInicio || undefined,
      dataFim: this.filtroDataFim || undefined,
      debito: this.filtroDebito || undefined,
      credito: this.filtroCredito || undefined
    }).subscribe({
      next: (res) => {
        this.lancamentos.set(res.items);
        this.totalLancamentos.set(res.total);
        // Se a página atual ficou além do total após filtro/exclusão, volta para 1
        if (this.pagina() > this.totalPaginas()) {
          this.pagina.set(1);
          this.carregarPagina();
          return;
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  carregarDescricoes(): void {
    this.api.listarDescricoes().subscribe({
      next: (lista) => this.descricoesSalvas.set(lista)
    });
  }

  // ===== Filtros =====
  aoMudarFiltroData(): void {
    this.pagina.set(1);
    this.carregarPagina();
  }

  aoDigitarFiltroTexto(): void {
    this.filtroTexto$.next();
  }

  private aoMudarFiltro(): void {
    this.pagina.set(1);
    this.carregarPagina();
  }

  limparFiltros(): void {
    this.filtroDataInicio = '';
    this.filtroDataFim = '';
    this.filtroDebito = '';
    this.filtroCredito = '';
    this.pagina.set(1);
    this.carregarPagina();
  }

  // ===== Paginação =====
  paginaAnterior(): void {
    if (this.pagina() > 1) {
      this.pagina.update(p => p - 1);
      this.carregarPagina();
    }
  }

  proximaPagina(): void {
    if (this.pagina() < this.totalPaginas()) {
      this.pagina.update(p => p + 1);
      this.carregarPagina();
    }
  }

  // ===== Valor formatado =====
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

  // ===== Dialog =====
  abrirDialog(): void {
    this.lancamentoEditandoId.set(null);
    this.form = {
      data: new Date().toISOString().split('T')[0],
      descricao: '',
      observacao: '',
      contaDebitoId: '',
      contaCreditoId: '',
      valor: 0
    };
    this.valorFormatado = '';
    this.error.set('');
    this.mostrarSugestoes.set(false);
    this.showDialog.set(true);
    setTimeout(() => this.valorInputRef?.nativeElement.focus(), 0);
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
    this.mostrarSugestoes.set(false);
    this.showDialog.set(true);
  }

  fecharDialog(): void {
    this.showDialog.set(false);
    this.lancamentoEditandoId.set(null);
    this.mostrarSugestoes.set(false);
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
        if (editandoId) {
          this.fecharDialog();
          this.carregarPagina();
        } else {
          // Modo criação: NÃO fecha. Limpa campos exceto data, foca em Valor.
          this.form = {
            data: this.form.data,
            descricao: '',
            observacao: '',
            contaDebitoId: '',
            contaCreditoId: '',
            valor: 0
          };
          this.valorFormatado = '';
          this.error.set('');
          this.mostrarSugestoes.set(false);
          this.carregarPagina();
          this.carregarDescricoes();
          setTimeout(() => this.valorInputRef?.nativeElement.focus(), 0);
        }
      },
      error: (err) => this.error.set(err.error?.message || (editandoId ? 'Erro ao atualizar lançamento.' : 'Erro ao criar lançamento.'))
    });
  }

  excluir(id: string): void {
    if (confirm('Deseja excluir este lançamento?')) {
      this.api.excluirLancamento(id).subscribe({
        next: () => this.carregarPagina()
      });
    }
  }

  contasAnaliticas(): PlanoContaResponse[] {
    return this.contas().filter(c => c.codigo.split('.').length === 5);
  }

  // ===== Autocomplete =====
  private normalizar(s: string): string {
    // Remove marcas diacríticas (range U+0300..U+036F) e lowercase
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  private filtrarDescricoes(termo: string, todas: readonly string[]): string[] {
    const t = this.normalizar((termo ?? '').trim());
    if (!t) return [];
    const matches = todas
      .map(d => ({ d, n: this.normalizar(d) }))
      .filter(x => x.n.includes(t));
    matches.sort((a, b) => {
      const aPref = a.n.startsWith(t) ? 0 : 1;
      const bPref = b.n.startsWith(t) ? 0 : 1;
      return aPref - bPref;
    });
    return matches.slice(0, 10).map(x => x.d);
  }

  selecionarSugestao(d: string): void {
    this.form.descricao = d;
    this.mostrarSugestoes.set(false);
  }

  onDescricaoFocus(): void {
    this.mostrarSugestoes.set(true);
  }

  onDescricaoBlur(): void {
    // Pequeno delay para permitir click/mousedown nas sugestões antes do blur fechar a lista
    setTimeout(() => this.mostrarSugestoes.set(false), 150);
  }
}
