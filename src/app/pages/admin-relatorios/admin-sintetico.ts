import { Component } from '@angular/core';
import { SinteticoComponent } from '../relatorios/sintetico';

@Component({
  selector: 'app-admin-sintetico',
  standalone: true,
  imports: [SinteticoComponent],
  template: '<app-sintetico [isAdmin]="true" />'
})
export class AdminSinteticoComponent {}
