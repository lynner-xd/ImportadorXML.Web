import { Component } from '@angular/core';
import { DreComponent } from '../relatorios/dre';

@Component({
  selector: 'app-admin-dre',
  standalone: true,
  imports: [DreComponent],
  template: '<app-dre [isAdmin]="true" />'
})
export class AdminDreComponent {}
