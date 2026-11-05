import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { EmpresaOption } from '../../core/models/relatorio.models';
import { PlanoContaAdmin } from '../../core/models/plano-conta.models';

@Component({
  selector: 'app-admin-plano-contas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-plano-contas.html',
  styleUrl: './admin-plano-contas.scss'
})
export class AdminPlanoContasComponent implements OnInit {
  empresas = signal<EmpresaOption[]>([]);
  contas = signal<PlanoContaAdmin[]>([]);
  loading = signal(false);
  successMsg = signal('');
  errorMsg = signal('');
  empresaId = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.listarEmpresas().subscribe({ next: e => this.empresas.set(e) });
  }

  onEmpresaChange(): void {
    this.successMsg.set('');
    this.errorMsg.set('');
    this.contas.set([]);
    this.loading.set(false);
    if (!this.empresaId) return;

    const pedido = this.empresaId;
    this.loading.set(true);
    this.api.getPlanoContasContador(pedido).subscribe({
      next: c => {
        if (pedido !== this.empresaId) return; // resposta de empresa que já não é a selecionada
        this.contas.set(c);
        this.loading.set(false);
      },
      error: err => {
        if (pedido !== this.empresaId) return;
        this.loading.set(false);
        this.errorMsg.set(err.error?.message || 'Erro ao carregar o plano de contas.');
      }
    });
  }

  /** Só o nível 5 (1.1.1.1.001, nivel === 4) é analítico e recebe código Domínio. */
  editavel(c: PlanoContaAdmin): boolean {
    return c.nivel === 4;
  }

  salvarDominio(c: PlanoContaAdmin, valor: string, input: HTMLInputElement): void {
    const novo = valor.trim();
    if (!this.editavel(c) || novo === (c.codigoDominio ?? '')) {
      input.value = c.codigoDominio ?? ''; // descarta espaços digitados sem mudança real
      return;
    }

    const empresa = this.empresaId;
    this.successMsg.set('');
    this.errorMsg.set('');
    this.api.definirCodigoDominio(c.id, empresa, novo || null).subscribe({
      next: () => {
        if (empresa !== this.empresaId) return;
        this.contas.update(lista => lista.map(x =>
          x.id === c.id ? { ...x, codigoDominio: novo || null, dominioRevisar: false } : x));
        input.value = novo;
        this.successMsg.set(novo ? `Código Domínio de ${c.nome} gravado.` : `Código Domínio de ${c.nome} removido.`);
      },
      error: err => {
        input.value = c.codigoDominio ?? '';
        this.errorMsg.set(err.error?.message || 'Erro ao gravar o código Domínio.');
      }
    });
  }
}
