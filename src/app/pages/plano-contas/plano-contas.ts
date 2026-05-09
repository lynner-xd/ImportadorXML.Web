import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { PlanoContaResponse } from '../../core/models/plano-conta.models';

interface ContaPai {
  codigo: string;
  label: string;
}

@Component({
  selector: 'app-plano-contas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './plano-contas.html',
  styleUrl: './plano-contas.scss'
})
export class PlanoContasComponent implements OnInit {
  contas = signal<PlanoContaResponse[]>([]);
  loading = signal(false);
  showDialog = signal(false);
  editando = signal<PlanoContaResponse | null>(null);
  error = signal('');

  contaPaiSelecionada = '';
  codigoGerado = signal('');
  form: { codigo: string; nome: string; tipo: string } = { codigo: '', nome: '', tipo: 'Ativo' };

  contasPai = computed<ContaPai[]>(() => {
    const todas = this.contas();
    // Permitir apenas até nível 4 (max 4 partes: 1, 1.1, 1.1.1, 1.1.1.1)
    return todas
      .filter(c => c.codigo.split('.').length <= 4)
      .map(c => ({
        codigo: c.codigo,
        label: `${c.codigo} - ${c.nome}`
      }));
  });

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.loading.set(true);
    this.api.listarPlanoContas().subscribe({
      next: (data) => { this.contas.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  abrirNovo(): void {
    this.contaPaiSelecionada = '';
    this.codigoGerado.set('');
    this.form = { codigo: '', nome: '', tipo: 'Ativo' };
    this.editando.set(null);
    this.error.set('');
    this.showDialog.set(true);
  }

  onContaPaiChange(): void {
    if (!this.contaPaiSelecionada) {
      this.codigoGerado.set('');
      this.form.codigo = '';
      return;
    }

    const prefixo = this.contaPaiSelecionada;
    const todas = this.contas();

    // Encontrar filhos diretos do pai selecionado
    const filhos = todas.filter(c => {
      if (!c.codigo.startsWith(prefixo + '.')) return false;
      const resto = c.codigo.substring(prefixo.length + 1);
      return !resto.includes('.');
    });

    // Encontrar o maior sequencial
    let maiorSeq = 0;
    filhos.forEach(f => {
      const partes = f.codigo.split('.');
      const ultimo = parseInt(partes[partes.length - 1], 10);
      if (ultimo > maiorSeq) maiorSeq = ultimo;
    });

    const proximo = maiorSeq + 1;
    const nivelPai = prefixo.split('.').length;
    const proximoFormatado = nivelPai >= 4 ? proximo.toString().padStart(3, '0') : proximo.toString();
    const novoCodigo = `${prefixo}.${proximoFormatado}`;

    this.codigoGerado.set(novoCodigo);
    this.form.codigo = novoCodigo;

    // Auto-detectar tipo baseado no prefixo raiz
    const raiz = prefixo.split('.')[0];
    if (raiz === '1') this.form.tipo = 'Ativo';
    else if (raiz === '2') this.form.tipo = 'Passivo';
    else if (raiz === '3') this.form.tipo = 'Receita';
    else if (raiz === '4') this.form.tipo = 'Despesa';
  }

  abrirEditar(conta: PlanoContaResponse): void {
    this.form = { codigo: conta.codigo, nome: conta.nome, tipo: conta.tipo };
    this.editando.set(conta);
    this.error.set('');
    this.showDialog.set(true);
  }

  salvar(): void {
    const edit = this.editando();

    if (edit) {
      if (!this.form.nome) {
        this.error.set('Preencha o nome.');
        return;
      }
      this.api.atualizarConta(edit.id, { nome: this.form.nome, tipo: this.form.tipo }).subscribe({
        next: () => { this.showDialog.set(false); this.carregar(); },
        error: (err) => this.error.set(err.error?.message || 'Erro ao atualizar.')
      });
    } else {
      if (!this.contaPaiSelecionada || !this.form.nome) {
        this.error.set('Selecione a conta pai e preencha o nome.');
        return;
      }
      this.api.criarConta({ codigoPai: this.contaPaiSelecionada, nome: this.form.nome }).subscribe({
        next: () => { this.showDialog.set(false); this.carregar(); },
        error: (err) => this.error.set(err.error?.message || 'Erro ao criar conta.')
      });
    }
  }

  getRowClass(conta: PlanoContaResponse, index: number): string {
    const codigo = conta.codigo.trim();
    const isRoot = codigo === '1' || codigo === '2' || codigo === '3' || codigo === '4';

    if (isRoot) {
      return codigo === '1' ? 'row-group-ativo'
        : codigo === '2' ? 'row-group-passivo'
        : codigo === '3' ? 'row-group-receita'
        : 'row-group-despesa';
    }

    return index % 2 === 1 ? 'row-zebra' : '';
  }

  excluir(id: string): void {
    if (confirm('Deseja excluir esta conta?')) {
      this.api.excluirConta(id).subscribe({
        next: () => this.carregar(),
        error: (err) => this.error.set(err.error?.message || err.error?.error || 'Erro ao excluir conta.')
      });
    }
  }
}
