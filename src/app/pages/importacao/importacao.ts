import { Component, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { DocumentoFiscal } from '../../core/models/documento.models';

@Component({
  selector: 'app-importacao',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './importacao.html',
  styleUrl: './importacao.scss'
})
export class ImportacaoComponent implements OnInit {
  readonly PAGE_SIZE = 50;

  documentos = signal<DocumentoFiscal[]>([]);
  totalDocumentos = signal(0);
  paginaAtual = signal(1);
  loading = signal(false);
  error = signal('');

  filtroTipo = '';
  filtroDataInicio = '';
  filtroDataFim = '';

  confirmandoExclusao = signal<string | null>(null);
  confirmandoExclusaoEmMassa = signal(false);

  selecionados = signal<Set<string>>(new Set());

  totalPaginas = computed(() => Math.ceil(this.totalDocumentos() / this.PAGE_SIZE));

  get temFiltroAtivo(): boolean {
    return !!(this.filtroTipo || this.filtroDataInicio || this.filtroDataFim);
  }

  todosSelecionados = computed(() => {
    const docs = this.documentos();
    if (docs.length === 0) return false;
    const sel = this.selecionados();
    return docs.every(d => sel.has(d.id));
  });

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.listarDocumentos(
      this.filtroTipo || undefined,
      this.filtroDataInicio || undefined,
      this.filtroDataFim || undefined,
      this.paginaAtual()
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

  limparFiltros(): void {
    this.filtroTipo = '';
    this.filtroDataInicio = '';
    this.filtroDataFim = '';
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

  nomeParticipante(doc: DocumentoFiscal): string {
    return (doc.tipo === 'Entrada' ? doc.nomeEmitente : doc.nomeDestinatario) ?? '-';
  }
}
