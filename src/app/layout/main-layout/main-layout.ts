import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, ConfirmDialogComponent],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayoutComponent implements OnInit {
  private auth = inject(AuthService);
  ngOnInit(): void { this.auth.carregarPerfil(); }
}
