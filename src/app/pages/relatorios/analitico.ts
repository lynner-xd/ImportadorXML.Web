import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AnaliticoItem, EmpresaOption } from '../../core/models/relatorio.models';
import { PlanoContaResponse } from '../../core/models/plano-conta.models';

@Component({
  selector: 'app-analitico',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './analitico.html',
  styleUrl: './relatorios.scss'
})
export class AnaliticoComponent implements OnInit {
  @Input() isAdmin = false;

  empresas = signal<EmpresaOption[]>([]);
  contas = signal<PlanoContaResponse[]>([]);
  empresaId = '';
  filtroNivel1 = '';
  filtroNivel2 = '';
  filtroNivel3 = '';
  filtroNivel4 = '';
  contaId = '';
  dataInicio = '';
  dataFim = '';
  dados = signal<AnaliticoItem[]>([]);
  loading = signal(false);
  gerado = signal(false);
  toastVisible = signal(false);
  toastMessage = signal('');

  get contasNivel1(): PlanoContaResponse[] {
    return this.contas().filter(c => c.codigo.split('.').length === 1);
  }

  get contasNivel2(): PlanoContaResponse[] {
    const todas = this.contas().filter(c => c.codigo.split('.').length === 2);
    if (!this.filtroNivel1) return todas;
    return todas.filter(c => c.codigo.startsWith(this.filtroNivel1 + '.'));
  }

  get contasNivel3(): PlanoContaResponse[] {
    const todas = this.contas().filter(c => c.codigo.split('.').length === 3);
    if (this.filtroNivel2) return todas.filter(c => c.codigo.startsWith(this.filtroNivel2 + '.'));
    if (this.filtroNivel1) return todas.filter(c => c.codigo.startsWith(this.filtroNivel1 + '.'));
    return todas;
  }

  get contasNivel4(): PlanoContaResponse[] {
    const todas = this.contas().filter(c => c.codigo.split('.').length === 4);
    if (this.filtroNivel3) return todas.filter(c => c.codigo.startsWith(this.filtroNivel3 + '.'));
    if (this.filtroNivel2) return todas.filter(c => c.codigo.startsWith(this.filtroNivel2 + '.'));
    if (this.filtroNivel1) return todas.filter(c => c.codigo.startsWith(this.filtroNivel1 + '.'));
    return todas;
  }

  get contasNivel5(): PlanoContaResponse[] {
    const todas = this.contas().filter(c => c.codigo.split('.').length === 5);
    if (this.filtroNivel4) return todas.filter(c => c.codigo.startsWith(this.filtroNivel4 + '.'));
    if (this.filtroNivel3) return todas.filter(c => c.codigo.startsWith(this.filtroNivel3 + '.'));
    if (this.filtroNivel2) return todas.filter(c => c.codigo.startsWith(this.filtroNivel2 + '.'));
    if (this.filtroNivel1) return todas.filter(c => c.codigo.startsWith(this.filtroNivel1 + '.'));
    return todas;
  }

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    const now = new Date();
    this.dataInicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    this.dataFim = now.toISOString().split('T')[0];

    if (this.isAdmin) {
      this.api.listarEmpresas().subscribe({ next: (e) => this.empresas.set(e) });
    }
    this.api.listarPlanoContas().subscribe({ next: (c) => this.contas.set(c) });
  }

  onNivel1Change(): void {
    this.filtroNivel2 = '';
    this.filtroNivel3 = '';
    this.filtroNivel4 = '';
    this.contaId = '';
  }

  onNivel2Change(): void {
    this.filtroNivel3 = '';
    this.filtroNivel4 = '';
    this.contaId = '';
  }

  onNivel3Change(): void {
    this.filtroNivel4 = '';
    this.contaId = '';
  }

  onNivel4Change(): void {
    this.contaId = '';
  }

  gerar(): void {
    if (!this.dataInicio || !this.dataFim) return;
    if (this.isAdmin && !this.empresaId) return;

    if (!this.contaId) {
      this.showToast('Selecione uma conta analítica (5º nível) para gerar o relatório.');
      return;
    }

    this.loading.set(true);
    const obs = this.isAdmin
      ? this.api.getAdminAnalitico(this.empresaId, this.dataInicio, this.dataFim, this.contaId)
      : this.api.getAnalitico(this.dataInicio, this.dataFim, this.contaId);

    obs.subscribe({
      next: (data) => { this.dados.set(data); this.loading.set(false); this.gerado.set(true); },
      error: () => this.loading.set(false)
    });
  }

  private showToast(message: string): void {
    this.toastMessage.set(message);
    this.toastVisible.set(true);
    setTimeout(() => this.toastVisible.set(false), 4000);
  }

  exportarPdf(): void {
    const extra = { contaId: this.contaId };
    const obs = this.isAdmin
      ? this.api.downloadAdminRelatorioPdf('analitico', this.empresaId, this.dataInicio, this.dataFim, extra)
      : this.api.downloadRelatorioPdf('analitico', this.dataInicio, this.dataFim, extra);

    obs.subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = this.nomeArquivo('analitico'); a.click();
        URL.revokeObjectURL(url);
      }
    });
  }

  private nomeArquivo(relatorio: string): string {
    const now = new Date();
    const p = (n: number) => n.toString().padStart(2, '0');
    const ts = `${p(now.getDate())}${p(now.getMonth() + 1)}${now.getFullYear()}${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}`;
    return `${relatorio}_${ts}.pdf`;
  }
}
