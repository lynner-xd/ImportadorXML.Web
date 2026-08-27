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

  // Seleção múltipla — por parcela (permite baixa em lote); excluir age sobre as notas das parcelas selecionadas
  selecionados = signal<Set<string>>(new Set());
  todosSelecionados = computed(() => {
    const parcelas = this.parcelas();
    const sel = this.selecionados();
    return parcelas.length > 0 && parcelas.every(p => sel.has(p.id));
  });
  selecionadasAbertas = computed(() =>
    this.parcelas().filter(p => this.selecionados().has(p.id) && !p.paga));

  // Filtros
  filtroStatus: 'abertas' | 'vencidas' | 'pagas' | 'todas' = 'todas';
  filtroVencInicio = '';
  filtroVencFim = '';
  filtroFornecedor = '';

  // Baixa
  baixaParcelaId = signal<string | null>(null);
  baixaLote = signal(false);
  dataPagamento = '';
  private contasAnaliticas = signal<PlanoContaResponse[]>([]);
  contasPagamento = computed(() => this.contasAnaliticas().filter(c => c.codigo.startsWith('1.1.1.')));
  contaPagamentoId = '';

  // Lançamento manual (sem nota): qualquer analítica exceto fornecedores 2.1.1.1.*
  contasDebito = computed(() => this.contasAnaliticas().filter(c => !c.codigo.startsWith('2.1.1.1.')));
  modoManual = signal(false);
  salvandoManual = signal(false);
  erroManual = signal('');
  manual = this.novoManual();

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
      next: contas => this.contasAnaliticas.set(contas.filter(c => c.codigo.split('.').length === 5))
    });
  }

  carregarPagina(): void {
    this.loading.set(true);
    const paga = this.filtroStatus === 'todas' ? undefined : this.filtroStatus === 'pagas';
    // Vencidas = em aberto com vencimento até ontem (mesma regra de estaVencida); a API filtra por dia inclusivo
    let vencimentoFim = this.filtroVencFim || undefined;
    if (this.filtroStatus === 'vencidas') {
      const ontem = hojeLocal(-1);
      vencimentoFim = vencimentoFim && vencimentoFim < ontem ? vencimentoFim : ontem;
    }
    this.api.listarParcelasContasPagar({
      page: this.pagina(), pageSize: this.pageSize, paga,
      vencimentoInicio: this.filtroVencInicio || undefined,
      vencimentoFim,
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
    return !p.paga && p.dataVencimento.slice(0, 10) < hojeLocal();
  }

  // ===== Baixa =====
  abrirBaixa(p: ContaPagarParcelaList): void {
    this.baixaParcelaId.set(p.id);
    this.dataPagamento = new Date().toISOString().slice(0, 10);
    const caixa = this.contasPagamento().find(c => c.codigo === '1.1.1.1.001');
    this.contaPagamentoId = caixa?.id ?? '';
  }

  abrirBaixaLote(): void {
    if (this.selecionadasAbertas().length === 0) return;
    this.baixaLote.set(true);
    this.dataPagamento = new Date().toISOString().slice(0, 10);
    const caixa = this.contasPagamento().find(c => c.codigo === '1.1.1.1.001');
    this.contaPagamentoId = caixa?.id ?? '';
  }

  fecharBaixa(): void {
    this.baixaParcelaId.set(null);
    this.baixaLote.set(false);
  }

  confirmarBaixa(): void {
    if (!this.dataPagamento || !this.contaPagamentoId) return;
    const ids = this.baixaLote()
      ? this.selecionadasAbertas().map(p => p.id)
      : [this.baixaParcelaId()].filter((id): id is string => !!id);
    if (ids.length === 0) return;
    forkJoin(ids.map(id =>
      this.api.pagarParcelaContaPagar(id, this.dataPagamento, this.contaPagamentoId, this.empresaParam))).subscribe({
      next: () => {
        this.fecharBaixa();
        if (ids.length > 1) this.showToast(`${ids.length} parcela(s) baixada(s).`);
        this.carregarPagina();
      },
      error: (err) => {
        this.fecharBaixa();
        this.carregarPagina();
        this.showToast(err.error?.message ?? 'Erro ao confirmar a baixa.');
      }
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
  toggleSelecao(parcelaId: string): void {
    const set = new Set(this.selecionados());
    if (set.has(parcelaId)) set.delete(parcelaId);
    else set.add(parcelaId);
    this.selecionados.set(set);
  }

  selecionarTodos(): void {
    this.selecionados.set(new Set(this.parcelas().map(p => p.id)));
  }

  limparSelecao(): void {
    this.selecionados.set(new Set());
  }

  async excluirSelecionados(): Promise<void> {
    const sel = this.selecionados();
    const notaIds = Array.from(new Set(
      this.parcelas().filter(p => sel.has(p.id)).map(p => p.contaPagarId)));
    if (notaIds.length === 0) return;
    const ok = await this.confirmService.confirmar({
      mensagem: `Você está prestes a excluir ${notaIds.length} nota(s) INTEIRA(S) — todas as parcelas dessas notas serão removidas, não só as selecionadas. Esta ação não pode ser desfeita.`,
      perigo: true,
      textoConfirmar: 'Excluir'
    });
    if (!ok) return;
    forkJoin(notaIds.map(id => this.api.excluirContaPagar(id, this.empresaParam))).subscribe({
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

  onFolderSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    // Só os XMLs do nível raiz da pasta (mesma regra da tela Importador XML)
    const xmlsRaiz = Array.from(input.files).filter(f =>
      f.name.toLowerCase().endsWith('.xml') &&
      (f as any).webkitRelativePath.split('/').length === 2
    );
    this.arquivos.set(xmlsRaiz);
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
    gerarParcelas(item, (item.base.dataEmissao ?? '').slice(0, 10), item.base.valorTotal ?? 0);
  }

  // ===== Lançamento manual =====
  private novoManual(): ManualEdicao {
    const hoje = new Date().toISOString().slice(0, 10);
    return {
      nomeFornecedor: '', cnpjFornecedor: '', documento: '', dataEmissao: hoje, valorTotal: 0,
      contaDebitoId: '', formaPagamento: 'AVista', numeroParcelas: 1,
      parcelas: [{ numero: 1, valor: 0, dataVencimento: hoje }]
    };
  }

  abrirManual(): void {
    this.manual = this.novoManual();
    this.erroManual.set('');
    this.modoManual.set(true);
  }

  fecharManual(): void { this.modoManual.set(false); }

  regerarParcelasManual(): void {
    gerarParcelas(this.manual, this.manual.dataEmissao, Number(this.manual.valorTotal) || 0);
  }

  salvarManual(): void {
    const m = this.manual;
    if (!m.nomeFornecedor.trim() || !m.cnpjFornecedor.trim() || !m.documento.trim() || !m.dataEmissao || !m.contaDebitoId) {
      this.erroManual.set('Preencha fornecedor, CNPJ/CPF, documento, data e conta de débito.');
      return;
    }
    if (!(Number(m.valorTotal) > 0)) { this.erroManual.set('Informe um valor maior que zero.'); return; }
    if (m.parcelas.some(p => !p.dataVencimento || !(Number(p.valor) > 0))) {
      this.erroManual.set('Preencha valor e vencimento de todas as parcelas.');
      return;
    }
    this.erroManual.set('');
    this.salvandoManual.set(true);
    this.api.criarContaPagarManual({
      nomeFornecedor: m.nomeFornecedor.trim(),
      cnpjFornecedor: m.cnpjFornecedor.replace(/\D/g, ''),
      documento: m.documento.trim(),
      dataEmissao: m.dataEmissao,
      valorTotal: Number(m.valorTotal),
      formaPagamento: m.formaPagamento,
      numeroParcelas: m.parcelas.length,
      contaDebitoId: m.contaDebitoId,
      parcelas: m.parcelas.map(p => ({ numero: p.numero, valor: Number(p.valor), dataVencimento: p.dataVencimento }))
    }, this.empresaParam).subscribe({
      next: () => {
        this.salvandoManual.set(false);
        this.fecharManual();
        this.showToast('Conta a pagar lançada.');
        this.carregarPagina();
      },
      error: (err) => {
        this.erroManual.set(err.error?.message ?? 'Erro ao salvar.');
        this.salvandoManual.set(false);
      }
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

// Data local yyyy-MM-dd deslocada em N dias (0 = hoje, -1 = ontem)
function hojeLocal(offsetDias = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDias);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

// Divide valorTotal em N parcelas mensais (arredondamento na última) — espelha ContasPagarService.GerarParcelas.
function gerarParcelas(alvo: ParcelasEdicao, emissao: string, valorTotal: number): void {
  if (alvo.formaPagamento === 'AVista') {
    alvo.numeroParcelas = 1;
    alvo.parcelas = [{ numero: 1, valor: valorTotal, dataVencimento: emissao }];
    return;
  }
  const n = Math.max(1, Math.min(60, Math.floor(alvo.numeroParcelas) || 1));
  alvo.numeroParcelas = n;
  const base = Math.floor((valorTotal / n) * 100) / 100;
  alvo.parcelas = Array.from({ length: n }, (_, i) => {
    const numero = i + 1;
    const valor = numero === n ? Math.round((valorTotal - base * (n - 1)) * 100) / 100 : base;
    return { numero, valor, dataVencimento: addMonthsClamped(emissao, numero) };
  });
}

interface ParcelasEdicao {
  formaPagamento: string;   // 'AVista' | 'APrazo'
  numeroParcelas: number;
  parcelas: { numero: number; valor: number; dataVencimento: string }[]; // dataVencimento yyyy-MM-dd
}

interface ManualEdicao extends ParcelasEdicao {
  nomeFornecedor: string;
  cnpjFornecedor: string;
  documento: string;
  dataEmissao: string;
  valorTotal: number;
  contaDebitoId: string;
}

interface PreviewEdicao extends ParcelasEdicao {
  base: ContaPagarPreviewItem;
  incluir: boolean;
}
