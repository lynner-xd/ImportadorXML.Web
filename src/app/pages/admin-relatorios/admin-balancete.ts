import { Component } from '@angular/core';
import { BalanceteComponent } from '../relatorios/balancete';

@Component({
  selector: 'app-admin-balancete',
  standalone: true,
  imports: [BalanceteComponent],
  template: '<app-balancete [isAdmin]="true" />'
})
export class AdminBalanceteComponent {}
