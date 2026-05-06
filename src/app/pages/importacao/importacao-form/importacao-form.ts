import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ImportacaoResultado } from '../../../core/models/importacao.models';

@Component({
  selector: 'app-importacao-form',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './importacao-form.html',
  styleUrl: './importacao-form.scss'
})
export class ImportacaoFormComponent implements OnInit {
  tipo = signal<string>('');
  arquivos = signal<File[]>([]);
  loading = signal(false);
  resultado = signal<ImportacaoResultado | null>(null);
  error = signal('');

  constructor(
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.tipo.set(this.route.snapshot.data['tipo'] ?? 'Entrada');
  }

  get titulo(): string {
    return this.tipo() === 'Saida' ? 'Importar Saída' : 'Importar Entrada';
  }

  get subtitulo(): string {
    return this.tipo() === 'Saida'
      ? 'Upload de NFe, NFCe ou NFSe emitidas pela empresa'
      : 'Upload de NFe, NFCe ou NFSe recebidas pela empresa';
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.arquivos.set(Array.from(input.files));
    }
  }

  importar(): void {
    if (this.arquivos().length === 0) {
      this.error.set('Selecione ao menos um arquivo XML.');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.resultado.set(null);

    const formData = new FormData();
    formData.append('tipo', this.tipo());
    this.arquivos().forEach(f => formData.append('arquivos', f));

    this.api.importarXml(formData).subscribe({
      next: (res) => {
        this.resultado.set(res);
        this.loading.set(false);
        this.arquivos.set([]);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'Erro ao importar arquivos.');
        this.loading.set(false);
      }
    });
  }

  limpar(): void {
    this.arquivos.set([]);
    this.resultado.set(null);
    this.error.set('');
  }

  sair(): void {
    this.router.navigate(['/importacao']);
  }

  statusClass(status: string): string {
    if (status === 'Importado') return 'status-ok';
    if (status === 'Duplicado') return 'status-dup';
    return 'status-err';
  }

  statusLabel(status: string): string {
    if (status === 'Importado') return 'Importado';
    if (status === 'Duplicado') return 'Duplicado';
    return 'Erro';
  }
}
