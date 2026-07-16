import { Component, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { ImportarPreview, PreviewLinha, RegraImportacao, CondicaoRegra } from '../../core/models/importacao.models';
import { PlanoContaResponse } from '../../core/models/plano-conta.models';
import { RegraImportacaoModalComponent } from '../../shared/regra-importacao-modal/regra-importacao-modal';

@Component({
  selector: 'app-importacao-extrato',
  standalone: true,
  imports: [CommonModule, FormsModule, RegraImportacaoModalComponent],
  templateUrl: './importacao-extrato.html',
  styleUrl: './importacao-extrato.scss'
})
export class ImportacaoExtratoComponent {
  private api = inject(ApiService);
  private router = inject(Router);
  private confirmService = inject(ConfirmService);

  arquivo = signal<File | null>(null);
  preview = signal<ImportarPreview | null>(null);
  contas = signal<PlanoContaResponse[]>([]);
  carregando = signal(false);
  salvando = signal(false);
  erro = signal<string | null>(null);
  showRegra = signal(false);
  regraSelecionada = signal<RegraImportacao | null>(null);

  analiticas = computed(() => this.contas().filter(c => c.codigo.split('.').length === 5));
  linhas = computed(() => this.preview()?.linhas ?? []);
  tudoOk = computed(() => this.linhas().length > 0 && this.linhas().every(l => l.ok));
  pendentes = computed(() => this.linhas().filter(l => !l.ok).length);

  constructor() {
    this.api.listarPlanoContas().subscribe({
      next: cs => this.contas.set(cs),
      error: () => this.erro.set('Falha ao carregar plano de contas.')
    });
  }

  onArquivo(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.arquivo.set(input.files?.[0] ?? null);
  }

  analisar(): void {
    const f = this.arquivo();
    if (!f) return;
    this.carregando.set(true);
    this.erro.set(null);
    this.api.previewImportacao(f).subscribe({
      next: p => { this.preview.set(p); this.carregando.set(false); },
      error: e => {
        this.erro.set(e?.error?.message ?? 'Falha ao analisar o arquivo.');
        this.carregando.set(false);
      }
    });
  }

  trocarBanco(codigo: string): void {
    const f = this.arquivo();
    if (f) {
      this.carregando.set(true);
      this.api.previewImportacao(f, codigo).subscribe({
        next: p => { this.preview.set(p); this.carregando.set(false); },
        error: e => {
          this.erro.set(e?.error?.message ?? 'Falha ao reprocessar. Tente novamente.');
          this.carregando.set(false);
        }
      });
    } else {
      const p = this.preview();
      if (!p) return;
      const transacoes = p.linhas.map(l => ({
        data: l.data,
        valor: l.valor,
        historico: l.historico,
        fitId: l.fitId
      }));
      this.carregando.set(true);
      this.api.reprocessarImportacao({ bancoCodigo: codigo, transacoes }).subscribe({
        next: np => { this.preview.set(np); this.carregando.set(false); },
        error: e => {
          this.erro.set(e?.error?.message ?? 'Falha ao reprocessar. Tente novamente.');
          this.carregando.set(false);
        }
      });
    }
  }

  abrirNovaRegra(): void {
    this.regraSelecionada.set({
      id: '',
      condicao: 'Contem' as CondicaoRegra,
      texto: '',
      contaDebitoId: '',
      ordem: 1
    });
    this.showRegra.set(true);
  }

  onRegraSalva(): void {
    this.showRegra.set(false);
    // Reaplica as regras (incluindo a nova) sobre as linhas atuais do preview
    if (this.preview()) this.reprocessar();
  }

  reprocessar(): void {
    const p = this.preview();
    if (!p) return;
    const transacoes = p.linhas.map(l => ({
      data: l.data,
      valor: l.valor,
      historico: l.historico,
      fitId: l.fitId
    }));
    this.carregando.set(true);
    this.api.reprocessarImportacao({ bancoCodigo: p.bancoCodigo, transacoes }).subscribe({
      next: np => { this.preview.set(np); this.carregando.set(false); },
      error: e => {
        this.erro.set(e?.error?.message ?? 'Falha ao reprocessar. Tente novamente.');
        this.carregando.set(false);
      }
    });
  }

  ajustarDebito(l: PreviewLinha, contaId: string | undefined): void {
    this.atualizarLinha(l, { contaDebitoId: contaId });
  }

  ajustarCredito(l: PreviewLinha, contaId: string | undefined): void {
    this.atualizarLinha(l, { contaCreditoId: contaId });
  }

  private atualizarLinha(l: PreviewLinha, patch: Partial<PreviewLinha>): void {
    const p = this.preview();
    if (!p) return;
    const linhas = p.linhas.map(x => {
      if (x.indice !== l.indice) return x;
      const merged = { ...x, ...patch };
      merged.ok = !!merged.contaDebitoId && !!merged.contaCreditoId;
      return merged;
    });
    this.preview.set({ ...p, linhas });
  }

  async removerLinha(l: PreviewLinha): Promise<void> {
    const ok = await this.confirmService.confirmar({
      mensagem: 'Remover esta linha da importação? Para recuperá-la será preciso reprocessar o arquivo.',
      perigo: true,
      textoConfirmar: 'Remover'
    });
    if (!ok) return;
    const p = this.preview();
    if (!p) return;
    this.preview.set({ ...p, linhas: p.linhas.filter(x => x.indice !== l.indice) });
  }

  limpar(): void {
    this.preview.set(null);
    this.arquivo.set(null);
    this.erro.set(null);
  }

  cancelar(): void {
    this.router.navigate(['/lancamentos']);
  }

  salvar(): void {
    if (!this.tudoOk()) return;
    const linhas = this.linhas().map(l => ({
      data: l.data,
      valor: l.valor,
      historico: l.historico,
      contaDebitoId: l.contaDebitoId,
      contaCreditoId: l.contaCreditoId,
      fitId: l.fitId
    }));
    this.salvando.set(true);
    this.api.confirmarImportacao({ linhas }).subscribe({
      next: () => { this.salvando.set(false); this.router.navigate(['/lancamentos']); },
      error: e => {
        this.erro.set(e?.error?.message ?? 'Falha ao salvar lançamentos.');
        this.salvando.set(false);
      }
    });
  }
}
