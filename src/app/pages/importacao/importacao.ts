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
  documentos = signal<DocumentoFiscal[]>([]);
  loading = signal(false);
  error = signal('');

  filtroTipo = signal<string>('');
  filtroDataInicio = signal<string>('');
  filtroDataFim = signal<string>('');

  confirmandoExclusao = signal<string | null>(null);

  documentosFiltrados = computed(() => {
    let lista = this.documentos();
    const tipo = this.filtroTipo();
    const di = this.filtroDataInicio();
    const df = this.filtroDataFim();

    if (tipo) lista = lista.filter(d => d.tipo === tipo);
    if (di) lista = lista.filter(d => d.dataImportacao >= di);
    if (df) lista = lista.filter(d => d.dataImportacao <= df + 'T23:59:59');

    return lista;
  });

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.listarDocumentos().subscribe({
      next: (docs) => {
        this.documentos.set(docs);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Erro ao carregar documentos.');
        this.loading.set(false);
      }
    });
  }

  limparFiltros(): void {
    this.filtroTipo.set('');
    this.filtroDataInicio.set('');
    this.filtroDataFim.set('');
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
        this.documentos.update(lista => lista.filter(d => d.id !== id));
        this.confirmandoExclusao.set(null);
      },
      error: () => {
        this.error.set('Erro ao excluir documento.');
        this.confirmandoExclusao.set(null);
      }
    });
  }

  nomeParticipante(doc: DocumentoFiscal): string {
    return (doc.tipo === 'Entrada' ? doc.nomeEmitente : doc.nomeDestinatario) ?? '-';
  }

  temFiltroAtivo = computed(() =>
    !!this.filtroTipo() || !!this.filtroDataInicio() || !!this.filtroDataFim()
  );
}
