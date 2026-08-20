import { Component, Input, OnDestroy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, forkJoin } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { ContaPagarParcelaList, ContaPagarPreviewItem } from '../../core/models/conta-pagar.models';
import { EmpresaOption } from '../../core/models/relatorio.models';
import { PlanoContaResponse } from '../../core/models/plano-conta.models';

@Component({
  selector: 'app-contas-pagar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contas-pagar.html',
  styleUrl: './contas-pagar.scss'
})
export class ContasPagarComponent implements OnInit, OnDestroy {
  @Input() isAdmin = false;
  private api = inject(ApiService);
  private confirmService = inject(ConfirmService);

  // Admin
  empresas = signal<EmpresaOption[]>([]);
  empresaId = '';

  // Lista
  parcelas = signal<ContaPagarParcelaList[]>([]);
  loading = signal(false);
  pagina = signal(1);
  readonly pageSize = 50;
  totalParcelas = signal(0);
  totalPaginas = computed(() => Math.max(1, Math.ceil(this.totalParcelas() / this.pageSize)));

  // Seleção múltipla — por nota (contaPagarId): excluir remove a nota inteira com todas as parcelas
  selecionados = signal<Set<string>>(new Set());
  todosSelecionados = computed(() => {
    const ids = new Set(this.parcelas().map(p => p.contaPagarId));
    const sel = this.selecionados();
    return ids.size > 0 && Array.from(ids).every(id => sel.has(id));
  });

  // Filtros
  filtroStatus: 'abertas' | 'pagas' | 'todas' = 'todas';
  filtroVencInicio = '';
  filtroVencFim = '';
  filtroFornecedor = '';

  // Baixa
  baixaParcelaId = signal<string | null>(null);
  dataPagamento = '';
  contasPagamento = signal<PlanoContaResponse[]>([]);
  contaPagamentoId = '';

  // Toast
  toastVisible = signal(false);
  toastMessage = signal('');

  private showToast(message: string): void {
    this.toastMessage.set(message);
    this.toastVisible.set(true);
    setTimeout(() => this.toastVisible.set(false), 4000);
  }

  private filtroTexto$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.filtroTexto$.pipe(debounceTime(400), takeUntil(this.destroy$))
      .subscribe(() => this.aoMudarFiltro());
    if (this.isAdmin) {
      this.api.listarEmpresas().subscribe({ next: e => this.empresas.set(e) });
    } else {
      this.carregarPagina();
      this.carregarContasPagamento();
    }
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  private get empresaParam(): string | undefined {
    return this.isAdmin ? this.empresaId : undefined;
  }

  onEmpresaChange(): void {
    this.modoImportacao.set(false);
    this.previewItens.set(null);
    this.arquivos.set([]);
    this.erroImportacao.set('');
    if (!this.empresaId) return;
    this.carregarContasPagamento();
    this.pagina.set(1);
    this.carregarPagina();
  }

  get temFiltroAtivo(): boolean {
    return !!(this.filtroVencInicio || this.filtroVencFim || this.filtroFornecedor || this.filtroStatus !== 'todas');
  }

  private carregarContasPagamento(): void {
    const obs = this.isAdmin
      ? this.api.getAdminPlanoContas(this.empresaId)
      : this.api.listarPlanoContas();
    obs.subscribe({
      next: contas => this.contasPagamento.set(
        contas.filter(c => c.codigo.startsWith('1.1.1.') && c.codigo.split('.').length === 5))
    });
  }

  carregarPagina(): void {
    this.loading.set(true);
    const paga = this.filtroStatus === 'todas' ? undefined : this.filtroStatus === 'pagas';
    this.api.listarParcelasContasPagar({
      page: this.pagina(), pageSize: this.pageSize, paga,
      vencimentoInicio: this.filtroVencInicio || undefined,
      vencimentoFim: this.filtroVencFim || undefined,
      fornecedor: this.filtroFornecedor || undefined,
      empresaId: this.empresaParam
    }).subscribe({
      next: (res) => {
        this.parcelas.set(res.items);
        this.totalParcelas.set(res.total);
        this.selecionados.set(new Set());
        if (this.pagina() > this.totalPaginas()) { this.pagina.set(1); this.carregarPagina(); return; }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  // ===== Filtros =====
  aoMudarFiltro(): void { this.pagina.set(1); this.carregarPagina(); }
  aoDigitarFiltroTexto(): void { this.filtroTexto$.next(); }
  limparFiltros(): void {
    this.filtroStatus = 'todas';
    this.filtroVencInicio = '';
    this.filtroVencFim = '';
    this.filtroFornecedor = '';
    this.pagina.set(1);
    this.carregarPagina();
  }

  // ===== Paginação =====
  paginaAnterior(): void { if (this.pagina() > 1) { this.pagina.update(p => p - 1); this.carregarPagina(); } }
  proximaPagina(): void { if (this.pagina() < this.totalPaginas()) { this.pagina.update(p => p + 1); this.carregarPagina(); } }
  irParaPagina(p: number): void {
    if (p < 1 || p > this.totalPaginas() || p === this.pagina()) return;
    this.pagina.set(p);
    this.carregarPagina();
  }

  // Vencida = em aberto com vencimento anterior a hoje (método regular: deriva de dados de linha)
  estaVencida(p: ContaPagarParcelaList): boolean {
    const hoje = new Date();
    const hojeLocal = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
    return !p.paga && p.dataVencimento.slice(0, 10) < hojeLocal;
  }

  // ===== Baixa =====
  abrirBaixa(p: ContaPagarParcelaList): void {
    this.baixaParcelaId.set(p.id);
    this.dataPagamento = new Date().toISOString().slice(0, 10);
    const caixa = this.contasPagamento().find(c => c.codigo === '1.1.1.1.001');
    this.contaPagamentoId = caixa?.id ?? '';
  }

  confirmarBaixa(): void {
    const id = this.baixaParcelaId();
    if (!id || !this.dataPagamento || !this.contaPagamentoId) return;
    this.api.pagarParcelaContaPagar(id, this.dataPagamento, this.contaPagamentoId, this.empresaParam).subscribe({
      next: () => { this.baixaParcelaId.set(null); this.carregarPagina(); },
      error: () => { this.baixaParcelaId.set(null); this.carregarPagina(); }
    });
  }

  async desfazerBaixa(p: ContaPagarParcelaList): Promise<void> {
    const ok = await this.confirmService.confirmar({
      mensagem: `Desfazer o pagamento da parcela ${p.numero}/${p.totalParcelas} da NF ${p.numeroNF}?`
    });
    if (!ok) return;
    this.api.desfazerPagamentoParcela(p.id, this.empresaParam).subscribe({
      next: () => this.carregarPagina(),
      error: () => this.carregarPagina()
    });
  }

  // ===== Seleção múltipla =====
  toggleSelecao(contaPagarId: string): void {
    const set = new Set(this.selecionados());
    if (set.has(contaPagarId)) set.delete(contaPagarId);
    else set.add(contaPagarId);
    this.selecionados.set(set);
  }

  selecionarTodos(): void {
    this.selecionados.set(new Set(this.parcelas().map(p => p.contaPagarId)));
  }

  limparSelecao(): void {
    this.selecionados.set(new Set());
  }

  async excluirSelecionados(): Promise<void> {
    const ids = Array.from(this.selecionados());
    if (ids.length === 0) return;
    const ok = await this.confirmService.confirmar({
      mensagem: `Você está prestes a excluir ${ids.length} nota(s) e todas as suas parcelas. Esta ação não pode ser desfeita.`,
      perigo: true,
      textoConfirmar: 'Excluir'
    });
    if (!ok) return;
    forkJoin(ids.map(id => this.api.excluirContaPagar(id, this.empresaParam))).subscribe({
      next: () => this.carregarPagina(),
      error: () => this.carregarPagina()
    });
  }

  async excluirNota(p: ContaPagarParcelaList): Promise<void> {
    const ok = await this.confirmService.confirmar({
      mensagem: `Excluir a NF ${p.numeroNF} de ${p.nomeFornecedor} e todas as suas parcelas? Esta ação não pode ser desfeita.`,
      perigo: true,
      textoConfirmar: 'Excluir'
    });
    if (!ok) return;
    this.api.excluirContaPagar(p.contaPagarId, this.empresaParam).subscribe({ next: () => this.carregarPagina() });
  }

  // ===== Importação =====
  modoImportacao = signal(false);
  arquivos = signal<File[]>([]);
  previewItens = signal<PreviewEdicao[] | null>(null);
  analisando = signal(false);
  confirmando = signal(false);
  erroImportacao = signal('');

  abrirImportacao(): void {
    this.modoImportacao.set(true);
    this.arquivos.set([]);
    this.previewItens.set(null);
    this.erroImportacao.set('');
  }

  fecharImportacao(): void {
    this.modoImportacao.set(false);
    this.carregarPagina();                  // reflete notas recém-criadas na lista
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) this.arquivos.set(Array.from(input.files));
  }

  analisar(): void {
    if (this.arquivos().length === 0) return;
    this.analisando.set(true);
    this.erroImportacao.set('');
    this.api.previewContasPagar(this.arquivos(), this.empresaParam).subscribe({
      next: (itens) => {
        this.previewItens.set(itens.map(base => ({
          base,
          incluir: base.sucesso,
          formaPagamento: base.formaPagamentoSugerida,
          numeroParcelas: Math.max(1, base.parcelasSugeridas.length),
          parcelas: base.parcelasSugeridas.map(p => ({
            numero: p.numero,
            valor: p.valor,
            dataVencimento: p.dataVencimento.slice(0, 10)
          }))
        })));
        this.analisando.set(false);
      },
      error: (err) => {
        this.erroImportacao.set(err.error?.message ?? 'Erro ao analisar os arquivos.');
        this.analisando.set(false);
      }
    });
  }

  // Regenera as parcelas quando o usuário muda forma de pagamento ou nº de parcelas.
  // Método regular (não computed) — os campos vêm de [(ngModel)].
  regerarParcelas(item: PreviewEdicao): void {
    const emissao = (item.base.dataEmissao ?? '').slice(0, 10);
    const valorTotal = item.base.valorTotal ?? 0;
    if (item.formaPagamento === 'AVista') {
      item.numeroParcelas = 1;
      item.parcelas = [{ numero: 1, valor: valorTotal, dataVencimento: emissao }];
      return;
    }
    const n = Math.max(1, Math.min(60, Math.floor(item.numeroParcelas) || 1));
    item.numeroParcelas = n;
    const base = Math.floor((valorTotal / n) * 100) / 100;
    item.parcelas = Array.from({ length: n }, (_, i) => {
      const numero = i + 1;
      const valor = numero === n ? Math.round((valorTotal - base * (n - 1)) * 100) / 100 : base;
      return { numero, valor, dataVencimento: addMonthsClamped(emissao, numero) };
    });
  }

  totalSelecionados(): number {
    return (this.previewItens() ?? []).filter(i => i.base.sucesso && i.incluir).length;
  }

  confirmarImportacao(): void {
    const itens = (this.previewItens() ?? [])
      .filter(i => i.base.sucesso && i.incluir)
      .map(i => ({
        chaveAcesso: i.base.chaveAcesso!,
        numeroNF: i.base.numeroNF ?? '',
        nomeFornecedor: i.base.nomeFornecedor ?? '',
        cnpjFornecedor: i.base.cnpjFornecedor ?? '',
        dataEmissao: i.base.dataEmissao!,
        valorTotal: i.base.valorTotal!,
        formaPagamento: i.formaPagamento,
        numeroParcelas: i.parcelas.length,
        parcelas: i.parcelas.map(p => ({
          numero: p.numero,
          valor: Number(p.valor),
          dataVencimento: p.dataVencimento
        }))
      }));
    if (itens.length === 0) return;
    if (itens.some(i => i.parcelas.some(p => !p.dataVencimento))) {
      this.erroImportacao.set('Preencha o vencimento de todas as parcelas.');
      return;
    }
    this.confirmando.set(true);
    this.api.confirmarContasPagar(itens, this.empresaParam).subscribe({
      next: (res) => {
        this.confirmando.set(false);
        let msg = `${res.totalCriados} conta(s) a pagar criada(s).`;
        if (res.erros.length > 0) msg += ` ${res.erros.length} nota(s) com erro: ${res.erros[0].mensagem}`;
        this.showToast(msg);
        this.fecharImportacao();
      },
      error: (err) => {
        this.erroImportacao.set(err.error?.message ?? 'Erro ao confirmar.');
        this.confirmando.set(false);
      }
    });
  }
}

// Replica o clamp do .NET DateTime.AddMonths (31/01 + 1 mês = 28/02, não 03/03).
function addMonthsClamped(dateStr: string, months: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const totalMonths = y * 12 + (m - 1) + months;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = totalMonths % 12; // 0-based
  const diasNoMesAlvo = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const dia = Math.min(d, diasNoMesAlvo);
  return `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

interface PreviewEdicao {
  base: ContaPagarPreviewItem;
  incluir: boolean;
  formaPagamento: string;   // 'AVista' | 'APrazo'
  numeroParcelas: number;
  parcelas: { numero: number; valor: number; dataVencimento: string }[]; // dataVencimento yyyy-MM-dd
}
