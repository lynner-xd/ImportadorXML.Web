import { Component, computed, signal, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { DocumentoFiscal, DocumentoDetalhe } from '../../core/models/documento.models';
import { PlanoContaResponse } from '../../core/models/plano-conta.models';

@Component({
  selector: 'app-importacao',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './importacao.html',
  styleUrl: './importacao.scss'
})
export class ImportacaoComponent implements OnInit, OnDestroy {
  readonly PAGE_SIZE = 50;

  documentos = signal<DocumentoFiscal[]>([]);
  totalDocumentos = signal(0);
  paginaAtual = signal(1);
  loading = signal(false);
  error = signal('');

  filtroTipo = '';
  filtroDataInicio = '';
  filtroDataFim = '';
  filtroNumero = '';
  filtroOrigem = '';

  private filtroNumero$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  confirmandoExclusao = signal<string | null>(null);
  confirmandoExclusaoEmMassa = signal(false);

  // Modal de edição das contas do lançamento (somente entradas)
  editandoDoc = signal<DocumentoDetalhe | null>(null);
  salvandoContas = signal(false);
  erroModal = signal('');
  contas = signal<PlanoContaResponse[]>([]);
  editContaDebitoId = '';
  editContaCreditoId = '';

  analiticas = computed(() => this.contas().filter(c => c.codigo.split('.').length === 5));

  selecionados = signal<Set<string>>(new Set());

  totalPaginas = computed(() => Math.ceil(this.totalDocumentos() / this.PAGE_SIZE));

  get temFiltroAtivo(): boolean {
    return !!(this.filtroTipo || this.filtroDataInicio || this.filtroDataFim || this.filtroNumero || this.filtroOrigem);
  }

  todosSelecionados = computed(() => {
    const docs = this.documentos();
    if (docs.length === 0) return false;
    const sel = this.selecionados();
    return docs.every(d => sel.has(d.id));
  });

  selecionadosSefaz = computed(() => {
    const sel = this.selecionados();
    return this.documentos().filter(d => sel.has(d.id) && d.origem === 'Sefaz').length;
  });

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.filtroNumero$
      .pipe(debounceTime(400), takeUntil(this.destroy$))
      .subscribe(() => this.onFiltroChange());

    this.carregar();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  carregar(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.listarDocumentos(
      this.filtroTipo || undefined,
      this.filtroDataInicio || undefined,
      this.filtroDataFim || undefined,
      this.paginaAtual(),
      this.PAGE_SIZE,
      this.filtroNumero.trim() || undefined,
      this.filtroOrigem || undefined
    ).subscribe({
      next: (result) => {
        this.documentos.set(result.items);
        this.totalDocumentos.set(result.total);
        const maxPage = Math.ceil(result.total / this.PAGE_SIZE) || 1;
        if (this.paginaAtual() > maxPage) {
          this.paginaAtual.set(maxPage);
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Erro ao carregar documentos.');
        this.loading.set(false);
      }
    });
  }

  onFiltroChange(): void {
    this.paginaAtual.set(1);
    this.selecionados.set(new Set());
    this.carregar();
  }

  onFiltroNumeroChange(): void {
    this.filtroNumero$.next();
  }

  limparFiltros(): void {
    this.filtroTipo = '';
    this.filtroDataInicio = '';
    this.filtroDataFim = '';
    this.filtroNumero = '';
    this.filtroOrigem = '';
    this.paginaAtual.set(1);
    this.selecionados.set(new Set());
    this.carregar();
  }

  irParaPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas()) return;
    this.paginaAtual.set(pagina);
    this.selecionados.set(new Set());
    this.carregar();
  }

  irParaEntrada(): void {
    this.router.navigate(['/importacao/entrada']);
  }

  irParaSaida(): void {
    this.router.navigate(['/importacao/saida']);
  }

  solicitarExclusao(id: string): void {
    this.confirmandoExclusao.set(id);
  }

  cancelarExclusao(): void {
    this.confirmandoExclusao.set(null);
  }

  confirmarExclusao(id: string): void {
    this.api.excluirDocumento(id).subscribe({
      next: () => {
        this.confirmandoExclusao.set(null);
        this.carregar();
      },
      error: () => {
        this.error.set('Erro ao excluir documento.');
        this.confirmandoExclusao.set(null);
      }
    });
  }

  toggleSelecao(id: string): void {
    const set = new Set(this.selecionados());
    if (set.has(id)) set.delete(id);
    else set.add(id);
    this.selecionados.set(set);
  }

  selecionarTodos(): void {
    this.selecionados.set(new Set(this.documentos().map(d => d.id)));
  }

  limparSelecao(): void {
    this.selecionados.set(new Set());
  }

  excluirSelecionados(): void {
    if (this.selecionados().size === 0) return;
    this.confirmandoExclusaoEmMassa.set(true);
  }

  confirmarExclusaoEmMassa(): void {
    const ids = Array.from(this.selecionados());
    this.confirmandoExclusaoEmMassa.set(false);
    this.api.excluirDocumentos(ids).subscribe({
      next: () => {
        this.selecionados.set(new Set());
        this.carregar();
      },
      error: () => this.error.set('Erro ao excluir documentos.')
    });
  }

  cancelarExclusaoEmMassa(): void {
    this.confirmandoExclusaoEmMassa.set(false);
  }

  abrirEdicao(doc: DocumentoFiscal): void {
    if (this.contas().length === 0) {
      this.api.listarPlanoContas().subscribe({
        next: cs => this.contas.set(cs),
        error: () => this.error.set('Erro ao carregar plano de contas.')
      });
    }
    this.erroModal.set('');
    this.api.obterDocumento(doc.id).subscribe({
      next: det => {
        this.editandoDoc.set(det);
        this.editContaDebitoId = det.lancamentos[0]?.contaDebitoId ?? '';
        this.editContaCreditoId = det.lancamentos[0]?.contaCreditoId ?? '';
      },
      error: () => this.error.set('Erro ao carregar documento.')
    });
  }

  fecharEdicao(): void {
    this.editandoDoc.set(null);
  }

  salvarContas(): void {
    const det = this.editandoDoc();
    if (!det || !this.editContaDebitoId || !this.editContaCreditoId) return;
    this.salvandoContas.set(true);
    this.erroModal.set('');
    this.api.atualizarContasDocumento(det.documento.id, {
      contaDebitoId: this.editContaDebitoId,
      contaCreditoId: this.editContaCreditoId
    }).subscribe({
      next: () => {
        this.salvandoContas.set(false);
        this.editandoDoc.set(null);
      },
      error: e => {
        this.erroModal.set(e?.error?.message ?? 'Erro ao salvar as contas.');
        this.salvandoContas.set(false);
      }
    });
  }

  nomeParticipante(doc: DocumentoFiscal): string {
    return (doc.tipo === 'Entrada' ? doc.nomeEmitente : doc.nomeDestinatario) ?? '-';
  }

  docSefaz(id: string): boolean {
    return this.documentos().find(d => d.id === id)?.origem === 'Sefaz';
  }
}
