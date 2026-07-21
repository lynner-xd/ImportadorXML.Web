import { Component } from '@angular/core';
import { SefazComponent } from '../sefaz/sefaz';

@Component({
  selector: 'app-admin-sefaz',
  standalone: true,
  imports: [SefazComponent],
  template: '<app-sefaz [isAdmin]="true" />'
})
export class AdminSefazComponent {}
