import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { BalanceteItem, EmpresaOption } from '../../core/models/relatorio.models';

@Component({
  selector: 'app-sintetico',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sintetico.html',
  styleUrl: './relatorios.scss'
})
export class SinteticoComponent implements OnInit {
  @Input() isAdmin = false;

  empresas = signal<EmpresaOption[]>([]);
  empresaId = '';
  codigoPrefixo = '';
  dataInicio = '';
  dataFim = '';
  dados = signal<BalanceteItem[]>([]);
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
      ? this.api.getAdminSintetico(this.empresaId, this.dataInicio, this.dataFim, this.codigoPrefixo || undefined)
      : this.api.getSintetico(this.dataInicio, this.dataFim, this.codigoPrefixo || undefined);

    obs.subscribe({
      next: (data) => { this.dados.set(data); this.loading.set(false); this.gerado.set(true); },
      error: () => this.loading.set(false)
    });
  }

  exportarPdf(): void {
    const extra: Record<string, string> = {};
    if (this.codigoPrefixo) extra['codigoPrefixo'] = this.codigoPrefixo;

    const obs = this.isAdmin
      ? this.api.downloadAdminRelatorioPdf('sintetico', this.empresaId, this.dataInicio, this.dataFim, extra)
      : this.api.downloadRelatorioPdf('sintetico', this.dataInicio, this.dataFim, extra);

    obs.subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'sintetico.pdf'; a.click();
        URL.revokeObjectURL(url);
      }
    });
  }
}
