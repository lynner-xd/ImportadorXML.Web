import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { RegraImportacao, RegraImportacaoRequest, CondicaoRegra } from '../../core/models/importacao.models';
import { PlanoContaResponse } from '../../core/models/plano-conta.models';

@Component({
  selector: 'app-regra-importacao-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './regra-importacao-modal.html',
  styleUrl: './regra-importacao-modal.scss'
})
export class RegraImportacaoModalComponent {
  private api = inject(ApiService);

  @Input() contas: PlanoContaResponse[] = [];
  @Output() salvo = new EventEmitter<void>();
  @Output() fechar = new EventEmitter<void>();

  // Parent fornece a regra (id vazio = nova; id preenchido = edição)
  form: RegraImportacao = this.nova();
  @Input() set regra(r: RegraImportacao | null) {
    this.form = r ? { ...r } : this.nova();
    this.erro.set(null);
  }

  salvando = signal(false);
  erro = signal<string | null>(null);

  get modoEdicao(): boolean {
    return !!this.form.id;
  }

  analiticas(): PlanoContaResponse[] {
    return this.contas.filter(c => c.codigo.split('.').length === 5);
  }

  textoDesabilitado(): boolean {
    return this.form.condicao === 'EmBranco' || this.form.condicao === 'Todos';
  }

  salvar(): void {
    if (!this.form.contaDebitoId) {
      this.erro.set('Selecione a conta de débito.');
      return;
    }
    if (this.textoDesabilitado()) this.form.texto = '';

    const payload: RegraImportacaoRequest = {
      condicao: this.form.condicao,
      texto: this.form.texto,
      contaDebitoId: this.form.contaDebitoId,
      ordem: this.form.ordem
    };

    this.salvando.set(true);
    this.erro.set(null);

    const req: Observable<unknown> = this.form.id
      ? this.api.atualizarRegraImportacao(this.form.id, payload)
      : this.api.criarRegraImportacao(payload);

    req.subscribe({
      next: () => { this.salvando.set(false); this.salvo.emit(); },
      error: (e: any) => {
        this.salvando.set(false);
        this.erro.set(e?.error?.message ?? 'Falha ao salvar a regra.');
      }
    });
  }

  private nova(): RegraImportacao {
    return { id: '', condicao: 'Contem' as CondicaoRegra, texto: '', contaDebitoId: '', ordem: 1 };
  }
}
