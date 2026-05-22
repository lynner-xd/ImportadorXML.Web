import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { BalancoPatrimonialResponse, EmpresaOption } from '../../core/models/relatorio.models';

@Component({
  selector: 'app-balanco-patrimonial',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './balanco-patrimonial.html',
  styleUrls: ['./relatorios.scss', './filtros.scss']
})
export class BalancoPatrimonialComponent implements OnInit {
  @Input() isAdmin = false;

  empresas = signal<EmpresaOption[]>([]);
  empresaId = '';
  dataInicio = '';
  dataFim = '';
  modo = signal<'sintetico' | 'analitico'>('sintetico');
  exibir = signal<'todos' | 'com-valor'>('todos');
  exibirAssinaturas = signal(true);
  exibirSaldoAnterior = signal(true);
  exibirClassificacao = signal(true);
  orientacao = signal<'retrato' | 'paisagem'>('paisagem');
  dados = signal<BalancoPatrimonialResponse | null>(null);
  loading = signal(false);
  gerado = signal(false);

  constructor(private api: ApiService, public auth: AuthService) {}

  ngOnInit(): void {
    const now = new Date();
    this.dataInicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    this.dataFim = now.toISOString().split('T')[0];

    if (this.isAdmin) {
      this.api.listarEmpresas().subscribe({ next: (e) => this.empresas.set(e) });
    }
  }

  setModo(m: 'sintetico' | 'analitico'): void {
    if (this.modo() === m) return;
    this.modo.set(m);
    if (this.gerado()) this.gerar();
  }

  setExibir(e: 'todos' | 'com-valor'): void {
    if (this.exibir() === e) return;
    this.exibir.set(e);
    if (this.gerado()) this.gerar();
  }

  gerar(): void {
    if (!this.dataInicio || !this.dataFim) return;
    if (this.isAdmin && !this.empresaId) return;

    this.loading.set(true);
    const obs = this.isAdmin
      ? this.api.getAdminBalancoPatrimonial(this.empresaId, this.dataInicio, this.dataFim, this.modo(), this.exibir())
      : this.api.getBalancoPatrimonial(this.dataInicio, this.dataFim, this.modo(), this.exibir());

    obs.subscribe({
      next: (data) => { this.dados.set(data); this.loading.set(false); this.gerado.set(true); },
      error: () => this.loading.set(false)
    });
  }

  exportarPdf(): void {
    const extra: Record<string, string> = {
      assinaturas: this.exibirAssinaturas() ? 'true' : 'false',
      saldoAnterior: this.exibirSaldoAnterior() ? 'true' : 'false',
      classificacao: this.exibirClassificacao() ? 'true' : 'false',
      orientacao: this.orientacao()
    };
    const obs = this.isAdmin
      ? this.api.downloadAdminBalancoPdf(this.empresaId, this.dataInicio, this.dataFim, this.modo(), this.exibir(), extra)
      : this.api.downloadBalancoPdf(this.dataInicio, this.dataFim, this.modo(), this.exibir(), extra);

    obs.subscribe({ next: (blob) => this.downloadBlob(blob, this.nomeArquivo('balanco-patrimonial')) });
  }

  formatValor(v: number): string {
    if (v === 0) return '-';
    const abs = Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return v < 0 ? `(R$ ${abs})` : `R$ ${abs}`;
  }

  isLinhaNegrito(nivel: number, isCalculado: boolean): boolean {
    return isCalculado || nivel <= 2;
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
