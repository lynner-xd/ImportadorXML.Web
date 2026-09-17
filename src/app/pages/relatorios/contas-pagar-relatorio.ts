import { Component, Input, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ContasPagarRelatorioResponse, EmpresaOption } from '../../core/models/relatorio.models';
import { PaginacaoComponent } from '../../shared/paginacao/paginacao';

@Component({
  selector: 'app-contas-pagar-relatorio',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginacaoComponent],
  templateUrl: './contas-pagar-relatorio.html',
  styleUrl: './relatorios.scss'
})
export class ContasPagarRelatorioComponent implements OnInit {
  @Input() isAdmin = false;

  empresas = signal<EmpresaOption[]>([]);
  empresaId = '';
  dataInicio = '';
  dataFim = '';
  status: 'aberto' | 'pago' | 'todos' = 'todos';
  dados = signal<ContasPagarRelatorioResponse | null>(null);
  readonly porPagina = 20;
  pagina = signal(1);
  fornecedores = computed(() => this.dados()?.fornecedores ?? []);
  fornecedoresPagina = computed(() => this.fornecedores().slice((this.pagina() - 1) * this.porPagina, this.pagina() * this.porPagina));
  loading = signal(false);
  gerado = signal(false);

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    const now = new Date();
    this.dataInicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    this.dataFim = now.toISOString().split('T')[0];
    if (this.isAdmin) {
      this.api.listarEmpresas().subscribe({ next: (e) => this.empresas.set(e) });
    }
  }

  gerar(): void {
    if (!this.dataInicio || !this.dataFim) return;
    if (this.isAdmin && !this.empresaId) return;

    this.loading.set(true);
    const obs = this.isAdmin
      ? this.api.getAdminContasPagarRelatorio(this.empresaId, this.dataInicio, this.dataFim, this.status)
      : this.api.getContasPagarRelatorio(this.dataInicio, this.dataFim, this.status);

    obs.subscribe({
      next: (data) => { this.pagina.set(1); this.dados.set(data); this.loading.set(false); this.gerado.set(true); },
      error: () => this.loading.set(false)
    });
  }

  exportarPdf(): void {
    const extra = { status: this.status };
    const obs = this.isAdmin
      ? this.api.downloadAdminRelatorioPdf('contas-pagar', this.empresaId, this.dataInicio, this.dataFim, extra)
      : this.api.downloadRelatorioPdf('contas-pagar', this.dataInicio, this.dataFim, extra);
    obs.subscribe({ next: (blob) => this.downloadBlob(blob, this.nomeArquivo('contas_pagar')) });
  }

  private nomeArquivo(relatorio: string): string {
    const now = new Date();
    const p = (n: number) => n.toString().padStart(2, '0');
    const ts = `${p(now.getDate())}${p(now.getMonth() + 1)}${now.getFullYear()}${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}`;
    return `${relatorio}_${ts}.pdf`;
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
