import { Component, ElementRef, HostListener, Input, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { DreResponse, EmpresaOption } from '../../core/models/relatorio.models';

const NIVEIS_DISPONIVEIS = [1, 2, 3, 4, 5] as const;

@Component({
  selector: 'app-dre',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dre.html',
  styleUrls: ['./relatorios.scss', './filtros.scss']
})
export class DreComponent implements OnInit {
  @Input() isAdmin = false;

  readonly niveisDisponiveis = NIVEIS_DISPONIVEIS;

  empresas = signal<EmpresaOption[]>([]);
  empresaId = '';
  dataInicio = '';
  dataFim = '';
  niveis = signal<number[]>([4, 5]);
  exibirAssinaturas = signal(true);
  exibirClassificacao = signal(true);
  dados = signal<DreResponse | null>(null);
  loading = signal(false);
  gerado = signal(false);
  niveisOpen = signal(false);

  niveisLabel = computed(() => {
    const n = this.niveis().slice().sort((a, b) => a - b);
    if (n.length === 0) return 'Selecione...';
    if (n.length === 5) return 'Todos os níveis';
    return n.map(x => `Nível ${x}`).join(', ');
  });

  constructor(private api: ApiService, public auth: AuthService, private el: ElementRef) {}

  ngOnInit(): void {
    const now = new Date();
    this.dataInicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    this.dataFim = now.toISOString().split('T')[0];

    if (this.isAdmin) {
      this.api.listarEmpresas().subscribe({ next: (e) => this.empresas.set(e) });
    }
  }

  @HostListener('document:click', ['$event.target'])
  onDocClick(target: EventTarget | null): void {
    if (!this.niveisOpen()) return;
    const root = this.el.nativeElement.querySelector('.dropdown-multiselect');
    if (root && target instanceof Node && !root.contains(target)) this.niveisOpen.set(false);
  }

  toggleNiveisOpen(): void {
    this.niveisOpen.update(v => !v);
  }

  toggleNivel(nivel: number): void {
    const atuais = this.niveis();
    if (atuais.includes(nivel)) {
      this.niveis.set(atuais.filter(n => n !== nivel));
    } else {
      this.niveis.set([...atuais, nivel].sort((a, b) => a - b));
    }
    if (this.gerado()) this.gerar();
  }

  isNivelSelecionado(nivel: number): boolean {
    return this.niveis().includes(nivel);
  }

  gerar(): void {
    if (!this.dataInicio || !this.dataFim) return;
    if (this.isAdmin && !this.empresaId) return;
    if (this.niveis().length === 0) return;

    this.loading.set(true);
    const obs = this.isAdmin
      ? this.api.getAdminDre(this.empresaId, this.dataInicio, this.dataFim, this.niveis())
      : this.api.getDre(this.dataInicio, this.dataFim, this.niveis());

    obs.subscribe({
      next: (data) => { this.dados.set(data); this.loading.set(false); this.gerado.set(true); },
      error: () => this.loading.set(false)
    });
  }

  exportarPdf(): void {
    const extra: Record<string, string> = {
      niveis: this.niveis().join(','),
      assinaturas: this.exibirAssinaturas() ? 'true' : 'false',
      classificacao: this.exibirClassificacao() ? 'true' : 'false'
    };
    const obs = this.isAdmin
      ? this.api.downloadAdminRelatorioPdf('dre', this.empresaId, this.dataInicio, this.dataFim, extra)
      : this.api.downloadRelatorioPdf('dre', this.dataInicio, this.dataFim, extra);

    obs.subscribe({ next: (blob) => this.downloadBlob(blob, this.nomeArquivo('dre')) });
  }

  formatValor(v: number): string {
    if (v === 0) return '-';
    const abs = Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return v < 0 ? `(R$ ${abs})` : `R$ ${abs}`;
  }

  formatValorComSinal(v: number, sinal: '+' | '-' | '='): string {
    if (v === 0) return '-';
    const abs = Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return sinal === '-' ? `(R$ ${abs})` : `R$ ${abs}`;
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
