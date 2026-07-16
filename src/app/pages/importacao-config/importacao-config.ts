import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Draggable, Droppable } from 'primeng/dragdrop';
import { ApiService } from '../../core/services/api.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { ConfiguracaoImportacao, RegraImportacao, CondicaoRegra } from '../../core/models/importacao.models';
import { PlanoContaResponse } from '../../core/models/plano-conta.models';
import { RegraImportacaoModalComponent } from '../../shared/regra-importacao-modal/regra-importacao-modal';

@Component({
  selector: 'app-importacao-config',
  standalone: true,
  imports: [CommonModule, FormsModule, Draggable, Droppable, RegraImportacaoModalComponent],
  templateUrl: './importacao-config.html',
  styleUrl: './importacao-config.scss'
})
export class ImportacaoConfigComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private confirmService = inject(ConfirmService);

  contas = signal<PlanoContaResponse[]>([]);
  regras = signal<RegraImportacao[]>([]);
  loading = signal(false);
  salvando = signal(false);
  showRegra = signal(false);
  regraSelecionada = signal<RegraImportacao | null>(null);

  // Drag-and-drop de ordenação
  salvandoOrdem = signal(false);
  erroOrdem = signal<string | null>(null);
  dragOverIndex = signal<number | null>(null);
  private dragIndex: number | null = null;

  // Plain object — evita problema de ngModel + signal mutation
  configForm: Omit<ConfiguracaoImportacao, 'regras'> = {};

  ngOnInit(): void {
    this.loading.set(true);
    this.api.listarPlanoContas().subscribe(cs => this.contas.set(cs));
    this.api.obterConfiguracaoImportacao().subscribe({
      next: c => {
        this.configForm = {
          contaDebitoPositivoId: c.contaDebitoPositivoId,
          contaCreditoPositivoId: c.contaCreditoPositivoId,
          contaCreditoNegativoId: c.contaCreditoNegativoId
        };
        this.regras.set(c.regras ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  voltar(): void {
    this.router.navigate(['/lancamentos']);
  }

  analiticas(): PlanoContaResponse[] {
    return this.contas().filter(c => c.codigo.split('.').length === 5);
  }

  contas1112(): PlanoContaResponse[] {
    return this.analiticas().filter(c => c.codigo.startsWith('1.1.1.2'));
  }

  salvarContas(): void {
    this.salvando.set(true);
    const dto: ConfiguracaoImportacao = {
      ...this.configForm,
      regras: this.regras()
    };
    this.api.salvarConfiguracaoImportacao(dto).subscribe({
      next: () => this.salvando.set(false),
      error: () => this.salvando.set(false)
    });
  }

  abrirNovaRegra(): void {
    this.regraSelecionada.set({
      id: '',
      condicao: 'Contem' as CondicaoRegra,
      texto: '',
      contaDebitoId: '',
      ordem: (this.regras()?.length ?? 0) + 1
    });
    this.showRegra.set(true);
  }

  editarRegra(r: RegraImportacao): void {
    this.regraSelecionada.set({ ...r });
    this.showRegra.set(true);
  }

  onRegraSalva(): void {
    this.showRegra.set(false);
    this.recarregarRegras();
  }

  // ===== Reordenação por drag-and-drop =====
  onDragStart(index: number): void {
    this.dragIndex = index;
  }

  onDragEnter(index: number): void {
    if (this.dragIndex !== null && this.dragIndex !== index) this.dragOverIndex.set(index);
  }

  onDragLeave(): void {
    this.dragOverIndex.set(null);
  }

  onDrop(targetIndex: number): void {
    const from = this.dragIndex;
    this.dragIndex = null;
    this.dragOverIndex.set(null);
    if (from === null || from === targetIndex) return;

    const anterior = this.regras();
    const arr = [...anterior];
    const [movida] = arr.splice(from, 1);
    arr.splice(targetIndex, 0, movida);

    // Atualização otimista — reflete na hora e persiste
    this.regras.set(arr);
    this.salvandoOrdem.set(true);
    this.erroOrdem.set(null);
    this.api.reordenarRegrasImportacao(arr.map(r => r.id)).subscribe({
      next: () => this.salvandoOrdem.set(false),
      error: e => {
        this.regras.set(anterior); // reverte
        this.salvandoOrdem.set(false);
        this.erroOrdem.set(e?.error?.message ?? 'Falha ao salvar a nova ordem.');
      }
    });
  }

  async excluirRegra(r: RegraImportacao): Promise<void> {
    if (!(await this.confirmService.confirmar({ mensagem: 'Excluir esta regra?', perigo: true, textoConfirmar: 'Excluir' }))) return;
    this.api.excluirRegraImportacao(r.id).subscribe({
      next: () => this.recarregarRegras()
    });
  }

  private recarregarRegras(): void {
    this.api.obterConfiguracaoImportacao().subscribe(c => {
      this.regras.set(c.regras ?? []);
    });
  }
}
