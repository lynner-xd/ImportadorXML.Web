import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { BalanceteItem, EmpresaOption } from '../../core/models/relatorio.models';

@Component({
  selector: 'app-balancete',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './balancete.html',
  styleUrl: './relatorios.scss'
})
export class BalanceteComponent implements OnInit {
  @Input() isAdmin = false;

  empresas = signal<EmpresaOption[]>([]);
  empresaId = '';
  dataInicio = '';
  dataFim = '';
  dados = signal<BalanceteItem[]>([]);
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

  gerar(): void {
    if (!this.dataInicio || !this.dataFim) return;
    if (this.isAdmin && !this.empresaId) return;

    this.loading.set(true);
    const obs = this.isAdmin
      ? this.api.getAdminBalancete(this.empresaId, this.dataInicio, this.dataFim)
      : this.api.getBalancete(this.dataInicio, this.dataFim);

    obs.subscribe({
      next: (data) => { this.dados.set(data); this.loading.set(false); this.gerado.set(true); },
      error: () => this.loading.set(false)
    });
  }

  exportarPdf(): void {
    const obs = this.isAdmin
      ? this.api.downloadAdminRelatorioPdf('balancete', this.empresaId, this.dataInicio, this.dataFim)
      : this.api.downloadRelatorioPdf('balancete', this.dataInicio, this.dataFim);

    obs.subscribe({ next: (blob) => this.downloadBlob(blob, 'balancete.pdf') });
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
