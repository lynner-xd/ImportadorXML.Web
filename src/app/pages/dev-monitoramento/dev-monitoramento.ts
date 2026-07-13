import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AtividadeMonitor, ErroMonitor, EmpresaMonitorOption } from '../../core/models/monitoramento.models';

const PAGE_SIZE = 50;

@Component({
  selector: 'app-dev-monitoramento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dev-monitoramento.html',
  styleUrl: './dev-monitoramento.scss'
})
export class DevMonitoramentoComponent implements OnInit {
  aba = signal<'atividades' | 'erros'>('atividades');

  empresas = signal<EmpresaMonitorOption[]>([]);
  atividades = signal<AtividadeMonitor[]>([]);
  erros = signal<ErroMonitor[]>([]);
  total = signal(0);
  pagina = signal(1);
  loading = signal(false);
  error = signal('');
  detalheExpandido = signal<string | null>(null);

  filtroEmpresa = '';
  filtroAcao = '';
  filtroOrigem = '';
  filtroDe = '';
  filtroAte = '';

  readonly acoes = [
    'ImportacaoRealizada', 'ExtratoImportado', 'LancamentoCriado',
    'LancamentoAtualizado', 'LancamentoExcluido', 'DocumentoExcluido', 'ContratoGerado'
  ];
  readonly origens = ['ImportacaoXml', 'ImportacaoExtrato', 'Sistema'];

  totalPaginas = computed(() => Math.ceil(this.total() / PAGE_SIZE) || 1);

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.listarMonitoramentoEmpresas().subscribe({
      next: (emps) => this.empresas.set(emps),
      error: () => {}
    });
    this.carregar();
  }

  selecionarAba(aba: 'atividades' | 'erros'): void {
    if (this.aba() === aba) return;
    this.aba.set(aba);
    this.pagina.set(1);
    this.detalheExpandido.set(null);
    this.carregar();
  }

  onFiltroChange(): void {
    this.pagina.set(1);
    this.carregar();
  }

  limparFiltros(): void {
    this.filtroEmpresa = '';
    this.filtroAcao = '';
    this.filtroOrigem = '';
    this.filtroDe = '';
    this.filtroAte = '';
    this.pagina.set(1);
    this.carregar();
  }

  get temFiltroAtivo(): boolean {
    return !!(this.filtroEmpresa || this.filtroAcao || this.filtroOrigem || this.filtroDe || this.filtroAte);
  }

  carregar(): void {
    this.loading.set(true);
    this.error.set('');
    if (this.aba() === 'atividades') {
      this.api.listarMonitoramentoAtividades({
        empresaId: this.filtroEmpresa || undefined,
        acao: this.filtroAcao || undefined,
        de: this.filtroDe || undefined,
        ate: this.filtroAte || undefined,
        page: this.pagina()
      }).subscribe({
        next: (r) => { this.atividades.set(r.items); this.total.set(r.total); this.loading.set(false); },
        error: () => { this.error.set('Erro ao carregar atividades.'); this.loading.set(false); }
      });
    } else {
      this.api.listarMonitoramentoErros({
        empresaId: this.filtroEmpresa || undefined,
        origem: this.filtroOrigem || undefined,
        de: this.filtroDe || undefined,
        ate: this.filtroAte || undefined,
        page: this.pagina()
      }).subscribe({
        next: (r) => { this.erros.set(r.items); this.total.set(r.total); this.loading.set(false); },
        error: () => { this.error.set('Erro ao carregar erros.'); this.loading.set(false); }
      });
    }
  }

  irParaPagina(p: number): void {
    if (p < 1 || p > this.totalPaginas()) return;
    this.pagina.set(p);
    this.carregar();
  }

  detalheRota = signal<string | null>(null);
  detalheMensagem = signal('');
  detalheCampos = signal<{ chave: string; valor: string }[]>([]);
  detalheStack = signal<string | null>(null);

  private static readonly LABELS_DETALHE: Record<string, string> = {
    Arquivo: 'Arquivo',
    Exception: 'Tipo de exceção',
    CausaRaiz: 'Causa raiz',
    MensagemOriginal: 'Mensagem original',
    SqlState: 'SQLSTATE',
    Tabela: 'Tabela',
    Constraint: 'Constraint',
    Coluna: 'Coluna',
    DetalheBanco: 'Detalhe do banco'
  };

  toggleDetalhe(e: ErroMonitor): void {
    if (this.detalheExpandido() === e.id) {
      this.detalheExpandido.set(null);
      return;
    }

    const det = this.parseDetalhes(e.detalhes);

    const metodo = det['Metodo'] ?? '';
    const path = det['Path'] ?? '';
    this.detalheRota.set(metodo || path ? `${metodo} ${path}`.trim() : null);

    this.detalheMensagem.set(det['MensagemCompleta'] ?? e.mensagem);
    this.detalheStack.set(det['StackTrace'] ?? null);

    const ocultos = ['Metodo', 'Path', 'StackTrace', 'MensagemCompleta'];
    this.detalheCampos.set(
      Object.entries(det)
        .filter(([chave]) => !ocultos.includes(chave))
        .map(([chave, valor]) => ({
          chave: DevMonitoramentoComponent.LABELS_DETALHE[chave] ?? chave,
          valor
        }))
    );

    this.detalheExpandido.set(e.id);
  }

  private parseDetalhes(detalhes: string | null): Record<string, string> {
    if (!detalhes) return {};
    try {
      const obj = JSON.parse(detalhes);
      const out: Record<string, string> = {};
      for (const [chave, valor] of Object.entries(obj)) {
        if (valor !== null && valor !== undefined && valor !== '') out[chave] = String(valor);
      }
      return out;
    } catch {
      return {};
    }
  }

  classeOrigem(origem: string): string {
    switch (origem) {
      case 'ImportacaoXml': return 'tag-xml';
      case 'ImportacaoExtrato': return 'tag-extrato';
      default: return 'tag-sistema';
    }
  }

  labelOrigem(origem: string): string {
    switch (origem) {
      case 'ImportacaoXml': return 'XML';
      case 'ImportacaoExtrato': return 'Extrato';
      default: return 'Sistema';
    }
  }
}
