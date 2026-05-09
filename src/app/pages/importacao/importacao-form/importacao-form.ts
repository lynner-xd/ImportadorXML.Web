import { Component, signal, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, Observable, Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { CanDeactivateComponent } from '../../../core/guards/can-deactivate.guard';
import { ApiService } from '../../../core/services/api.service';
import { ImportacaoResultado } from '../../../core/models/importacao.models';

@Component({
  selector: 'app-importacao-form',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './importacao-form.html',
  styleUrl: './importacao-form.scss'
})
export class ImportacaoFormComponent implements OnInit, CanDeactivateComponent {
  readonly CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

  tipo = signal<string>('');
  arquivos = signal<File[]>([]);
  loading = signal(false);
  resultado = signal<ImportacaoResultado | null>(null);
  error = signal('');
  progressoChunk = signal(0);
  arquivoAtual = signal('');
  faseUpload = signal<'chunks' | 'processando'>('chunks');
  cancelando = signal(false);
  confirmandoSaida = signal(false);

  private isCancelled = false;
  private cancel$ = new Subject<void>();
  private saidaConfirmada$ = new Subject<boolean>();

  constructor(
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.loading()) {
      event.preventDefault();
    }
  }

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

  onFolderSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const xmlsRaiz = Array.from(input.files).filter(f =>
      f.name.toLowerCase().endsWith('.xml') &&
      (f as any).webkitRelativePath.split('/').length === 2
    );
    this.arquivos.set(xmlsRaiz);
  }

  iconeArquivo(nome: string): string {
    const ext = nome.split('.').pop()?.toLowerCase();
    if (ext === 'zip' || ext === 'rar') return 'pi pi-file-export';
    return 'pi pi-file-o';
  }

  canDeactivate(): boolean | Observable<boolean> {
    if (!this.loading() || this.cancelando()) return true;
    this.confirmandoSaida.set(true);
    return this.saidaConfirmada$.asObservable().pipe(take(1));
  }

  confirmarSaida(): void {
    this.confirmandoSaida.set(false);
    this.cancelar();
    this.saidaConfirmada$.next(true);
  }

  cancelarSaida(): void {
    this.confirmandoSaida.set(false);
    this.saidaConfirmada$.next(false);
  }

  cancelar(): void {
    this.isCancelled = true;
    this.cancelando.set(true);
    this.cancel$.next();
  }

  async importar(): Promise<void> {
    const todos = this.arquivos();
    if (todos.length === 0) {
      this.error.set('Selecione ao menos um arquivo XML, ZIP ou RAR.');
      return;
    }

    this.isCancelled = false;
    this.cancelando.set(false);
    this.cancel$ = new Subject<void>();

    this.loading.set(true);
    this.error.set('');
    this.resultado.set(null);
    this.progressoChunk.set(0);
    this.arquivoAtual.set('');
    this.faseUpload.set('chunks');

    const xmlFiles = todos.filter(f => f.name.toLowerCase().endsWith('.xml'));
    const comprimidos = todos.filter(f =>
      f.name.toLowerCase().endsWith('.zip') || f.name.toLowerCase().endsWith('.rar')
    );

    try {
      const resultados: ImportacaoResultado[] = [];

      if (xmlFiles.length > 0) {
        const formData = new FormData();
        formData.append('tipo', this.tipo());
        xmlFiles.forEach(f => formData.append('arquivos', f, f.name));
        const res = await firstValueFrom(this.api.importarXml(formData));
        resultados.push(res);
      }

      for (const arquivo of comprimidos) {
        if (this.isCancelled) break;
        this.arquivoAtual.set(arquivo.name);
        this.progressoChunk.set(0);
        this.faseUpload.set('chunks');
        const res = await this.uploadChunk(arquivo, this.tipo());
        if (this.isCancelled) break;
        if (res) resultados.push(res);
      }

      if (!this.isCancelled) {
        this.resultado.set(this.agregarResultados(resultados));
        this.arquivos.set([]);
      }
    } catch (err: any) {
      if (!this.isCancelled) {
        this.error.set(err.error?.message ?? 'Erro ao importar arquivos.');
      }
    } finally {
      this.loading.set(false);
      this.cancelando.set(false);
      this.progressoChunk.set(0);
      this.arquivoAtual.set('');
      this.faseUpload.set('chunks');
    }
  }

  private async uploadChunk(arquivo: File, tipo: string): Promise<ImportacaoResultado | null> {
    const sessionId = crypto.randomUUID();
    const totalChunks = Math.ceil(arquivo.size / this.CHUNK_SIZE);
    let resultado: ImportacaoResultado | null = null;

    for (let i = 0; i < totalChunks; i++) {
      if (this.isCancelled) break;

      const isLast = i === totalChunks - 1;
      const start = i * this.CHUNK_SIZE;
      const end = Math.min(start + this.CHUNK_SIZE, arquivo.size);
      const chunkBlob = arquivo.slice(start, end);

      const formData = new FormData();
      formData.append('sessionId', sessionId);
      formData.append('fileName', arquivo.name);
      formData.append('chunkIndex', i.toString());
      formData.append('totalChunks', totalChunks.toString());
      formData.append('tipo', tipo);
      formData.append('chunk', chunkBlob, arquivo.name);

      if (isLast) {
        this.progressoChunk.set(100);
        this.faseUpload.set('processando');
      }

      const res = await firstValueFrom(
        this.api.importarChunk(formData).pipe(takeUntil(this.cancel$)),
        { defaultValue: null }
      );

      if (this.isCancelled) break;
      if (res !== null) resultado = res;

      if (!isLast) {
        this.progressoChunk.set(Math.round(((i + 1) / totalChunks) * 100));
      }
    }

    return resultado;
  }

  private agregarResultados(resultados: ImportacaoResultado[]): ImportacaoResultado {
    return {
      totalProcessados: resultados.reduce((s, r) => s + r.totalProcessados, 0),
      totalImportados:  resultados.reduce((s, r) => s + r.totalImportados, 0),
      totalDuplicados:  resultados.reduce((s, r) => s + r.totalDuplicados, 0),
      totalErros:       resultados.reduce((s, r) => s + r.totalErros, 0),
      valorTotalImportado: resultados.reduce((s, r) => s + r.valorTotalImportado, 0),
      itensProcessados: resultados.flatMap(r => r.itensProcessados),
      erros:            resultados.flatMap(r => r.erros)
    };
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
