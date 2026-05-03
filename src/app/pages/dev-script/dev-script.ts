import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ScriptResultadoResponse, ScriptHistoricoResponse } from '../../core/models/script.models';

@Component({
  selector: 'app-dev-script',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dev-script.html',
  styleUrl: './dev-script.scss'
})
export class DevScriptComponent implements OnInit {
  script = signal('');
  loading = signal(false);
  resultado = signal<ScriptResultadoResponse | null>(null);
  erro = signal<string | null>(null);
  historico = signal<ScriptHistoricoResponse[]>([]);

  colunas = computed(() => this.resultado()?.columns ?? []);

  linhas = computed(() =>
    this.resultado()?.rows?.map(r =>
      Object.fromEntries(this.colunas().map((c, i) => [c, r[i]]))
    ) ?? []
  );

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.carregarHistorico();
  }

  executar(): void {
    const sql = this.script().trim();
    if (!sql) return;

    const scriptBase64 = btoa(unescape(encodeURIComponent(sql)));
    this.loading.set(true);
    this.resultado.set(null);
    this.erro.set(null);

    this.api.devExecutarScript(scriptBase64).subscribe({
      next: (res) => {
        this.resultado.set(res);
        this.loading.set(false);
        this.carregarHistorico();
      },
      error: (err) => {
        this.erro.set(err.error?.message || 'Erro ao executar script.');
        this.loading.set(false);
      }
    });
  }

  carregarHistorico(): void {
    this.api.devHistoricoScripts().subscribe({
      next: (data) => this.historico.set(data)
    });
  }

  selecionarHistorico(item: ScriptHistoricoResponse): void {
    this.script.set(item.script);
  }

  previewHistorico(item: ScriptHistoricoResponse): string {
    return item.script.length > 60 ? item.script.substring(0, 60) + '…' : item.script;
  }

  formatarData(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
}
