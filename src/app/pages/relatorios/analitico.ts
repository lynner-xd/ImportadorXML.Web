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
  contaId = '';
  dataInicio = '';
  dataFim = '';
  dados = signal<AnaliticoItem[]>([]);
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
    this.api.listarPlanoContas().subscribe({ next: (c) => this.contas.set(c) });
  }

  gerar(): void {
    if (!this.dataInicio || !this.dataFim || !this.contaId) return;
    if (this.isAdmin && !this.empresaId) return;

    this.loading.set(true);
    const obs = this.isAdmin
      ? this.api.getAdminAnalitico(this.empresaId, this.dataInicio, this.dataFim, this.contaId)
      : this.api.getAnalitico(this.dataInicio, this.dataFim, this.contaId);

    obs.subscribe({
      next: (data) => { this.dados.set(data); this.loading.set(false); this.gerado.set(true); },
      error: () => this.loading.set(false)
    });
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
        a.href = url; a.download = 'analitico.pdf'; a.click();
        URL.revokeObjectURL(url);
      }
    });
  }
}
