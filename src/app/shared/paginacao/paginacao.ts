import { Component, computed, input, model } from '@angular/core';

@Component({
  selector: 'app-paginacao',
  standalone: true,
  templateUrl: './paginacao.html',
  styleUrl: './paginacao.scss'
})
export class PaginacaoComponent {
  pagina = model.required<number>();
  totalItens = input.required<number>();
  porPagina = input<number>(50);
  rotulo = input<string>('itens');

  totalPaginas = computed(() => Math.max(1, Math.ceil(this.totalItens() / this.porPagina())));
  inicio = computed(() => this.totalItens() === 0 ? 0 : (this.pagina() - 1) * this.porPagina() + 1);
  fim = computed(() => Math.min(this.pagina() * this.porPagina(), this.totalItens()));

  irPara(p: number): void {
    if (p < 1 || p > this.totalPaginas() || p === this.pagina()) return;
    this.pagina.set(p);
  }
}
