import { Component, Input, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { map } from 'rxjs';
import { AnaliticoAdmin, AnaliticoAdminItem, EmpresaOption } from '../../core/models/relatorio.models';
import { PlanoContaResponse } from '../../core/models/plano-conta.models';
import { PaginacaoComponent } from '../../shared/paginacao/paginacao';

@Component({
  selector: 'app-analitico',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginacaoComponent],
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
  dados = signal<AnaliticoAdminItem[]>([]);
  contaDominio = signal<string | null>(null);
  contaFiltro = signal<{ id: string; codigo: string; nome: string } | null>(null);
  readonly porPagina = 50;
  pagina = signal(1);
  dadosPagina = computed(() => this.dados().slice((this.pagina() - 1) * this.porPagina, this.pagina() * this.porPagina));
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
    } else {
      this.api.listarPlanoContas().subscribe({ next: (c) => this.contas.set(c) });
    }
  }

  onEmpresaChange(): void {
    this.contas.set([]);
    this.filtroNivel1 = '';
    this.filtroNivel2 = '';
    this.filtroNivel3 = '';
    this.filtroNivel4 = '';
    this.contaId = '';
    if (!this.empresaId) return;
    this.api.getAdminPlanoContas(this.empresaId).subscribe({ next: (c) => this.contas.set(c) });
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
      : this.api.getAnalitico(this.dataInicio, this.dataFim, this.contaId).pipe(
          // Empresa: a API não traz Domínio; a coluna nem é renderizada.
          map((itens): AnaliticoAdmin => ({
            contaCodigo: '', contaNome: '', contaDominio: null,
            itens: itens.map(i => ({ ...i, contrapartidaId: '', contrapartidaDominio: null }))
          })));

    obs.subscribe({
      next: (data) => {
        this.dados.set(data.itens);
        this.contaDominio.set(data.contaDominio);
        this.contaFiltro.set(this.isAdmin ? { id: this.contaId, codigo: data.contaCodigo, nome: data.contaNome } : null);
        this.pagina.set(1);
        this.loading.set(false);
        this.gerado.set(true);
      },
      error: () => this.loading.set(false)
    });
  }

  // Método regular (não computed): reage ao que o usuário grava na grade.
  temPendencia(): boolean {
    return this.isAdmin && (!this.contaDominio() || this.dados().some(i => !i.contrapartidaDominio));
  }

  salvarDominio(contaId: string, valor: string, input: HTMLInputElement): void {
    const codigo = valor.trim();
    if (!codigo) { input.value = ''; return; }
    this.api.definirCodigoDominio(contaId, this.empresaId, codigo).subscribe({
      next: () => {
        this.dados.update(l => l.map(i => i.contrapartidaId === contaId ? { ...i, contrapartidaDominio: codigo } : i));
        if (contaId === this.contaFiltro()?.id) this.contaDominio.set(codigo);
      },
      error: (err) => {
        input.value = '';
        this.showToast(err.error?.message ?? 'Não foi possível salvar o código Domínio.');
      }
    });
  }

  /// Quantas contas distintas estão sem código: as contrapartidas pendentes mais,
  /// se for o caso, a própria conta do filtro.
  private contasSemDominio(): number {
    const pendentes = new Set(this.dados().filter(i => !i.contrapartidaDominio).map(i => i.contrapartidaId));
    if (!this.contaDominio()) pendentes.add(this.contaFiltro()?.id ?? this.contaId);
    return pendentes.size;
  }

  exportarTxt(): void {
    // O botão fica clicável mesmo com pendência: um botão morto não explica nada.
    if (this.temPendencia()) {
      const n = this.contasSemDominio();
      this.showToast(n === 1
        ? 'Há 1 conta sem código Domínio nesta listagem. Preencha o código na coluna Domínio antes de gerar o TXT.'
        : `Há ${n} contas sem código Domínio nesta listagem. Preencha os códigos na coluna Domínio antes de gerar o TXT.`);
      return;
    }

    this.api.downloadAdminAnaliticoTxt(this.empresaId, this.dataInicio, this.dataFim, this.contaFiltro()?.id ?? this.contaId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = this.nomeArquivo('analitico', 'txt'); a.click();
        URL.revokeObjectURL(url);
      },
      // Com responseType blob, o corpo do 409 chega como Blob.
      error: async (err) => {
        let msg = 'Não foi possível gerar o TXT.';
        try { msg = JSON.parse(await (err.error as Blob).text()).message ?? msg; } catch { /* mantém padrão */ }
        this.showToast(msg);
      }
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

  exportarExcel(): void {
    const extra = { contaId: this.contaId };
    const obs = this.isAdmin
      ? this.api.downloadAdminRelatorioExcel('analitico', this.empresaId, this.dataInicio, this.dataFim, extra)
      : this.api.downloadRelatorioExcel('analitico', this.dataInicio, this.dataFim, extra);

    obs.subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = this.nomeArquivo('analitico', 'xlsx'); a.click();
        URL.revokeObjectURL(url);
      }
    });
  }

  private nomeArquivo(relatorio: string, extensao: 'pdf' | 'xlsx' | 'txt' = 'pdf'): string {
    const now = new Date();
    const p = (n: number) => n.toString().padStart(2, '0');
    const ts = `${p(now.getDate())}${p(now.getMonth() + 1)}${now.getFullYear()}${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}`;
    return `${relatorio}_${ts}.${extensao}`;
  }
}
