import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ImportacaoResultado } from '../../core/models/importacao.models';

@Component({
  selector: 'app-importacao',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './importacao.html',
  styleUrl: './importacao.scss'
})
export class ImportacaoComponent {
  tipo: string = 'Entrada';
  arquivos: File[] = [];
  loading = signal(false);
  resultado = signal<ImportacaoResultado | null>(null);
  error = signal('');

  constructor(private api: ApiService) {}

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.arquivos = Array.from(input.files);
    }
  }

  importar(): void {
    if (this.arquivos.length === 0) {
      this.error.set('Selecione ao menos um arquivo XML.');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.resultado.set(null);

    const formData = new FormData();
    formData.append('tipo', this.tipo);
    this.arquivos.forEach(f => formData.append('arquivos', f));

    this.api.importarXml(formData).subscribe({
      next: (res) => {
        this.resultado.set(res);
        this.loading.set(false);
        this.arquivos = [];
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Erro ao importar arquivos.');
        this.loading.set(false);
      }
    });
  }

  limpar(): void {
    this.arquivos = [];
    this.resultado.set(null);
    this.error.set('');
  }
}
