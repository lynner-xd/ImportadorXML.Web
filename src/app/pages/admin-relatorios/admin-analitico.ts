import { Component } from '@angular/core';
import { AnaliticoComponent } from '../relatorios/analitico';

@Component({
  selector: 'app-admin-analitico',
  standalone: true,
  imports: [AnaliticoComponent],
  template: '<app-analitico [isAdmin]="true" />'
})
export class AdminAnaliticoComponent {}
