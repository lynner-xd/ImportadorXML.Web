import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  expanded?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class SidebarComponent {
  constructor(public auth: AuthService) {}

  menuItems = computed<MenuItem[]>(() => {
    if (this.auth.isContador()) {
      return [
        { label: 'Home', icon: 'pi pi-home', route: '/home' },
        {
          label: 'Relatórios', icon: 'pi pi-chart-bar', children: [
            { label: 'Balancete', icon: 'pi pi-list', route: '/admin/relatorios/balancete' },
            { label: 'Analítico', icon: 'pi pi-search', route: '/admin/relatorios/analitico' },
            { label: 'Sintético', icon: 'pi pi-table', route: '/admin/relatorios/sintetico' },
          ]
        },
        { label: 'Usuários', icon: 'pi pi-users', route: '/admin/usuarios' },
        {
          label: 'Configurações', icon: 'pi pi-cog', children: [
            { label: 'Email SMTP', icon: 'pi pi-envelope', route: '/admin/email' },
          ]
        },
      ];
    }

    return [
      { label: 'Home', icon: 'pi pi-home', route: '/home' },
      { label: 'Importar XML', icon: 'pi pi-upload', route: '/importacao' },
      { label: 'Lançamentos', icon: 'pi pi-pencil', route: '/lancamentos' },
      { label: 'Plano de Contas', icon: 'pi pi-sitemap', route: '/plano-contas' },
      {
        label: 'Relatórios', icon: 'pi pi-chart-bar', children: [
          { label: 'Balancete', icon: 'pi pi-list', route: '/relatorios/balancete' },
          { label: 'Analítico', icon: 'pi pi-search', route: '/relatorios/analitico' },
          { label: 'Sintético', icon: 'pi pi-table', route: '/relatorios/sintetico' },
        ]
      },
    ];
  });

  rootMenuItems = computed(() =>
    this.menuItems().map(item => ({
      label: item.label,
      icon: item.icon,
      route: item.route ?? item.children?.[0]?.route,
    }))
  );

  toggleExpand(item: MenuItem): void {
    item.expanded = !item.expanded;
  }

  logout(): void {
    this.auth.logout();
  }
}
