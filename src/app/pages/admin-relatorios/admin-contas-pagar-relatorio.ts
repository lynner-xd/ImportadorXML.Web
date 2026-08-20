import { Component } from '@angular/core';
import { ContasPagarRelatorioComponent } from '../relatorios/contas-pagar-relatorio';

@Component({
  selector: 'app-admin-contas-pagar-relatorio',
  standalone: true,
  imports: [ContasPagarRelatorioComponent],
  template: '<app-contas-pagar-relatorio [isAdmin]="true" />'
})
export class AdminContasPagarRelatorioComponent {}
