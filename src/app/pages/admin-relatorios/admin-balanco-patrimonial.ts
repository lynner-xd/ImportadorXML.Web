import { Component } from '@angular/core';
import { BalancoPatrimonialComponent } from '../relatorios/balanco-patrimonial';

@Component({
  selector: 'app-admin-balanco-patrimonial',
  standalone: true,
  imports: [BalancoPatrimonialComponent],
  template: '<app-balanco-patrimonial [isAdmin]="true" />'
})
export class AdminBalancoPatrimonialComponent {}
