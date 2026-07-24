import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { ConfiguracaoSefaz, NotaSefazPendente, SefazBuscaResultado } from '../../core/models/sefaz.models';
import { EmpresaOption } from '../../core/models/relatorio.models';

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
  'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

@Component({
  selector: 'app-sefaz',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sefaz.html',
  styleUrl: './sefaz.scss'
})
export class SefazComponent implements OnInit, OnDestroy {
  @Input() isAdmin = false;

  private api = inject(ApiService);
  private confirmService = inject(ConfirmService);

  readonly ufs = UFS;

  // admin
  empresas = signal<EmpresaOption[]>([]);
  empresaId = '';

  // configuração
  config = signal<ConfiguracaoSefaz | null>(null);
  arquivoPfx = signal<File | null>(null);
  senha = '';
  uf = '';
  manifestacaoAutomatica = true;
  salvandoConfig = signal(false);
  erroConfig = signal<string | null>(null);

  // busca
  buscando = signal(false);
  resultadoBusca = signal<SefazBuscaResultado | null>(null);
  erroBusca = signal<string | null>(null);

  // pendentes
  notas = signal<NotaSefazPendente[]>([]);
  total = signal(0);
  page = signal(1);
  readonly pageSize = 50;
  filtroStatus = '';
  filtroModelo = '';
  filtroTipo = '';
  filtroCnpj = '';
  private filtroCnpj$ = new Subject<void>();
  private destroy$ = new Subject<void>();
  filtroDataInicio = '';
  filtroDataFim = '';
  carregando = signal(false);
  processando = signal(false);
  erroLista = signal<string | null>(null);
  mensagemSucesso = signal<string | null>(null);

  selecionados = signal<Set<string>>(new Set());
  mensagemVisivel = signal<string | null>(null);
  selecionaveis = computed(() => this.notas().filter(n => n.status === 'Completa'));
  todosSelecionados = computed(() => {
    const itens = this.selecionaveis();
    if (itens.length === 0) return false;
    const sel = this.selecionados();
    return itens.every(n => sel.has(n.id));
  });
  totalPaginas = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize)));
  certificadoVencido = computed(() => {
    const v = this.config()?.certificadoValidade;
    return !!v && new Date(v) < new Date();
  });
  certificadoVencendo = computed(() => {
    const v = this.config()?.certificadoValidade;
    if (!v) return false;
    const dias = (new Date(v).getTime() - Date.now()) / 86400000;
    return dias > 0 && dias < 30;
  });

  ngOnInit(): void {
    this.filtroCnpj$
      .pipe(debounceTime(400), takeUntil(this.destroy$))
      .subscribe(() => this.filtrar());

    if (this.isAdmin) {
      this.api.listarEmpresas().subscribe({ next: e => this.empresas.set(e) });
    } else {
      this.carregarTudo();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFiltroCnpjChange(): void {
    this.filtroCnpj$.next();
  }

  onEmpresaChange(): void {
    if (!this.empresaId) return;
    this.config.set(null);
    this.notas.set([]);
    this.resultadoBusca.set(null);
    this.limparSelecao();
    this.carregarTudo();
  }

  private get empresaParam(): string | undefined {
    return this.isAdmin ? this.empresaId : undefined;
  }

  private carregarTudo(): void {
    this.carregarConfig();
    this.carregarNotas();
  }

  carregarConfig(): void {
    this.api.getSefazConfiguracao(this.empresaParam).subscribe({
      next: c => {
        this.config.set(c);
        this.uf = c.uf || '';
        this.manifestacaoAutomatica = c.manifestacaoAutomatica;
      },
      error: e => this.erroConfig.set(e?.error?.message ?? 'Falha ao carregar a configuração.')
    });
  }

  onArquivoPfx(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.arquivoPfx.set(input.files?.[0] ?? null);
  }

  salvarConfig(): void {
    this.erroConfig.set(null);
    if (!this.uf) { this.erroConfig.set('Selecione a UF da empresa.'); return; }
    const pfx = this.arquivoPfx();
    if (pfx && !this.senha) { this.erroConfig.set('Informe a senha do certificado.'); return; }

    const form = new FormData();
    if (pfx) {
      form.append('certificado', pfx);
      form.append('senha', this.senha);
    }
    form.append('manifestacaoAutomatica', String(this.manifestacaoAutomatica));
    form.append('uf', this.uf);

    this.salvandoConfig.set(true);
    this.api.salvarSefazConfiguracao(form, this.empresaParam).subscribe({
      next: c => {
        this.config.set(c);
        this.arquivoPfx.set(null);
        this.senha = '';
        this.salvandoConfig.set(false);
        this.mensagemSucesso.set('Configuração salva com sucesso.');
      },
      error: e => {
        this.erroConfig.set(e?.error?.message ?? 'Falha ao salvar a configuração.');
        this.salvandoConfig.set(false);
      }
    });
  }

  buscar(): void {
    this.erroBusca.set(null);
    this.buscando.set(true);
    this.api.buscarNotasSefaz(this.empresaParam).subscribe({
      next: r => {
        this.resultadoBusca.set(r);
        this.buscando.set(false);
        this.carregarConfig();
        this.carregarNotas();
      },
      error: e => {
        this.erroBusca.set(e?.error?.message ?? 'Falha na consulta à SEFAZ.');
        this.buscando.set(false);
      }
    });
  }

  carregarNotas(): void {
    this.carregando.set(true);
    this.erroLista.set(null);
    this.api.listarNotasSefaz({
      status: this.filtroStatus || undefined,
      modelo: this.filtroModelo || undefined,
      tipo: this.filtroTipo || undefined,
      cnpj: this.filtroCnpj.trim() || undefined,
      dataInicio: this.filtroDataInicio || undefined,
      dataFim: this.filtroDataFim || undefined,
      page: this.page(),
      pageSize: this.pageSize
    }, this.empresaParam).subscribe({
      next: r => {
        this.notas.set(r.items);
        this.total.set(r.total);
        this.carregando.set(false);
      },
      error: e => {
        this.erroLista.set(e?.error?.message ?? 'Falha ao carregar as notas.');
        this.carregando.set(false);
      }
    });
  }

  filtrar(): void {
    this.page.set(1);
    this.limparSelecao();
    this.carregarNotas();
  }

  irPara(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas()) return;
    this.page.set(pagina);
    this.limparSelecao();
    this.carregarNotas();
  }

  toggleMensagem(id: string): void {
    this.mensagemVisivel.set(this.mensagemVisivel() === id ? null : id);
  }

  toggleSelecao(id: string): void {
    const set = new Set(this.selecionados());
    if (set.has(id)) set.delete(id); else set.add(id);
    this.selecionados.set(set);
  }

  selecionarTodos(): void {
    this.selecionados.set(new Set(this.selecionaveis().map(n => n.id)));
  }

  limparSelecao(): void {
    this.selecionados.set(new Set());
  }

  async importarSelecionadas(): Promise<void> {
    const ids = Array.from(this.selecionados());
    if (ids.length === 0) return;
    const ok = await this.confirmService.confirmar({
      mensagem: `Importar ${ids.length} nota(s)? Serão gerados os documentos fiscais e lançamentos contábeis.`,
      textoConfirmar: 'Importar'
    });
    if (!ok) return;

    this.processando.set(true);
    this.mensagemSucesso.set(null);
    this.erroLista.set(null);
    this.api.importarNotasSefaz(ids, this.empresaParam).subscribe({
      next: r => {
        this.processando.set(false);
        this.mensagemSucesso.set(
          `Importação concluída: ${r.totalImportados} importada(s), ${r.totalDuplicados} duplicada(s), ${r.totalErros} erro(s).`);
        this.limparSelecao();
        this.carregarNotas();
      },
      error: e => {
        this.erroLista.set(e?.error?.message ?? 'Falha na importação.');
        this.processando.set(false);
      }
    });
  }

  async ignorarSelecionadas(): Promise<void> {
    const ids = Array.from(this.selecionados());
    if (ids.length === 0) return;
    const ok = await this.confirmService.confirmar({
      mensagem: `Ignorar ${ids.length} nota(s)? Elas não serão importadas.`,
      perigo: true,
      textoConfirmar: 'Ignorar'
    });
    if (!ok) return;

    this.processando.set(true);
    this.api.ignorarNotasSefaz(ids, this.empresaParam).subscribe({
      next: () => {
        this.processando.set(false);
        this.limparSelecao();
        this.carregarNotas();
      },
      error: e => {
        this.erroLista.set(e?.error?.message ?? 'Falha ao ignorar as notas.');
        this.processando.set(false);
      }
    });
  }

  manifestar(nota: NotaSefazPendente): void {
    this.processando.set(true);
    this.erroLista.set(null);
    this.api.manifestarNotaSefaz(nota.id, this.empresaParam).subscribe({
      next: () => {
        this.processando.set(false);
        this.mensagemSucesso.set(
          'Ciência da Operação registrada. O XML completo chegará nas próximas buscas.');
      },
      error: e => {
        this.erroLista.set(e?.error?.message ?? 'Falha ao manifestar ciência.');
        this.processando.set(false);
      }
    });
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'Resumo': return 'Aguardando XML';
      case 'Completa': return 'Completa';
      case 'Importada': return 'Importada';
      case 'Ignorada': return 'Ignorada';
      case 'Cancelada': return 'Cancelada';
      case 'Erro': return 'Erro';
      case 'Excluida': return 'Excluída';
      default: return status;
    }
  }

  tipoLabel(tipo: string): string {
    return tipo === 'Saida' ? 'Saída' : 'Entrada';
  }

  baixarXml(nota: NotaSefazPendente): void {
    this.api.downloadXmlNotaSefaz(nota.id, this.empresaParam).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${nota.chaveAcesso}.xml`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.erroLista.set('Falha ao baixar o XML da nota.')
    });
  }
}
