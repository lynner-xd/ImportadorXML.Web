import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import {
  ConfiguracaoBuscaAutomatica,
  FilaBuscaAutomaticaItem,
  ExecucaoResumo,
  ExecucaoDetalhe
} from '../../core/models/sefaz-automatico.models';

@Component({
  selector: 'app-admin-sefaz-automatico',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-sefaz-automatico.html',
  styleUrl: './admin-sefaz-automatico.scss'
})
export class AdminSefazAutomaticoComponent implements OnInit {
  private api = inject(ApiService);

  readonly horas = Array.from({ length: 24 }, (_, i) => i);

  // ===== Configuração =====
  config = signal<ConfiguracaoBuscaAutomatica | null>(null);
  ativa = false;
  horaInicio = 6;
  horaFim = 18;
  salvandoConfig = signal(false);
  erroConfig = signal<string | null>(null);
  mensagemConfig = signal<string | null>(null);

  // ===== Fila =====
  fila = signal<FilaBuscaAutomaticaItem[]>([]);
  carregandoFila = signal(false);
  erroFila = signal<string | null>(null);
  processandoFila = signal<string | null>(null);

  // ===== Histórico =====
  execucoes = signal<ExecucaoResumo[]>([]);
  totalExecucoes = signal(0);
  page = signal(1);
  readonly pageSize = 20;
  carregandoHistorico = signal(false);
  erroHistorico = signal<string | null>(null);
  totalPaginas = computed(() => Math.max(1, Math.ceil(this.totalExecucoes() / this.pageSize)));

  expandidoId = signal<string | null>(null);
  detalhes = signal<Record<string, ExecucaoDetalhe>>({});
  carregandoDetalhe = signal<string | null>(null);
  erroDetalhe = signal<string | null>(null);

  ngOnInit(): void {
    this.carregarConfig();
    this.carregarFila();
    this.carregarHistorico();
  }

  // ----- Configuração -----
  carregarConfig(): void {
    this.api.getSefazAutomaticoConfig().subscribe({
      next: c => {
        this.config.set(c);
        this.ativa = c.ativa;
        this.horaInicio = c.horaInicio;
        this.horaFim = c.horaFim;
      },
      error: e => this.erroConfig.set(e?.error?.message ?? 'Falha ao carregar a configuração.')
    });
  }

  salvarConfig(): void {
    this.erroConfig.set(null);
    this.mensagemConfig.set(null);
    if (this.horaFim <= this.horaInicio) {
      this.erroConfig.set('O horário final deve ser maior que o horário inicial.');
      return;
    }

    const dto: ConfiguracaoBuscaAutomatica = { ativa: this.ativa, horaInicio: this.horaInicio, horaFim: this.horaFim };
    this.salvandoConfig.set(true);
    this.api.salvarSefazAutomaticoConfig(dto).subscribe({
      next: c => {
        this.config.set(c);
        this.salvandoConfig.set(false);
        this.mensagemConfig.set('Configuração salva com sucesso.');
      },
      error: e => {
        this.erroConfig.set(e?.error?.message ?? 'Falha ao salvar a configuração.');
        this.salvandoConfig.set(false);
      }
    });
  }

  // ----- Fila -----
  carregarFila(): void {
    this.carregandoFila.set(true);
    this.erroFila.set(null);
    this.api.getSefazAutomaticoFila().subscribe({
      next: f => {
        this.fila.set(f);
        this.carregandoFila.set(false);
      },
      error: e => {
        this.erroFila.set(e?.error?.message ?? 'Falha ao carregar a fila.');
        this.carregandoFila.set(false);
      }
    });
  }

  toggleFila(item: FilaBuscaAutomaticaItem): void {
    this.erroFila.set(null);
    this.processandoFila.set(item.empresaId);
    this.api.toggleSefazAutomaticoFila(item.empresaId).subscribe({
      next: () => {
        this.processandoFila.set(null);
        this.carregarFila();
      },
      error: e => {
        this.erroFila.set(e?.error?.message ?? 'Falha ao atualizar a fila.');
        this.processandoFila.set(null);
      }
    });
  }

  certificadoVencido(item: FilaBuscaAutomaticaItem): boolean {
    const v = item.certificadoValidade;
    return !!v && new Date(v) < new Date();
  }

  certificadoVencendo(item: FilaBuscaAutomaticaItem): boolean {
    const v = item.certificadoValidade;
    if (!v) return false;
    const dias = (new Date(v).getTime() - Date.now()) / 86400000;
    return dias > 0 && dias < 30;
  }

  // ----- Histórico -----
  carregarHistorico(): void {
    this.carregandoHistorico.set(true);
    this.erroHistorico.set(null);
    this.api.listarSefazAutomaticoExecucoes(this.page(), this.pageSize).subscribe({
      next: r => {
        this.execucoes.set(r.items);
        this.totalExecucoes.set(r.total);
        this.carregandoHistorico.set(false);
      },
      error: e => {
        this.erroHistorico.set(e?.error?.message ?? 'Falha ao carregar o histórico.');
        this.carregandoHistorico.set(false);
      }
    });
  }

  irPara(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas()) return;
    this.page.set(pagina);
    this.expandidoId.set(null);
    this.carregarHistorico();
  }

  toggleLinha(execucao: ExecucaoResumo): void {
    if (this.expandidoId() === execucao.id) {
      this.expandidoId.set(null);
      return;
    }
    this.expandidoId.set(execucao.id);
    this.erroDetalhe.set(null);
    if (this.detalhes()[execucao.id]) return;

    this.carregandoDetalhe.set(execucao.id);
    this.api.getSefazAutomaticoExecucao(execucao.id).subscribe({
      next: d => {
        this.detalhes.update(m => ({ ...m, [execucao.id]: d }));
        this.carregandoDetalhe.set(null);
      },
      error: e => {
        this.erroDetalhe.set(e?.error?.message ?? 'Falha ao carregar os detalhes da execução.');
        this.carregandoDetalhe.set(null);
      }
    });
  }

  duracaoMinutos(execucao: ExecucaoResumo): string {
    if (!execucao.fim) return '—';
    const minutos = Math.round((new Date(execucao.fim).getTime() - new Date(execucao.inicio).getTime()) / 60000);
    return `${minutos} min`;
  }

  resumoExecucao(execucao: ExecucaoResumo): string {
    return `${execucao.concluidas} concluída(s) · ${execucao.erros} erro(s) · ${execucao.naoExecutadas} não executada(s)`;
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'Concluida': return 'Concluída';
      case 'Erro': return 'Erro';
      case 'Cancelada': return 'Cancelada';
      case 'NaoExecutada': return 'Não executada';
      case 'Interrompida': return 'Interrompida';
      case 'EmAndamento': return 'Em andamento';
      default: return status;
    }
  }
}
