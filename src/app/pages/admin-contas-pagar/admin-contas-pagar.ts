import { Component } from '@angular/core';
import { ContasPagarComponent } from '../contas-pagar/contas-pagar';

@Component({
  selector: 'app-admin-contas-pagar',
  standalone: true,
  imports: [ContasPagarComponent],
  template: '<app-contas-pagar [isAdmin]="true" />'
})
export class AdminContasPagarComponent {}
