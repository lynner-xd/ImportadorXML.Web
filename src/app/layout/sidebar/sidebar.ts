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
  tela?: string;
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
            { label: 'DRE', icon: 'pi pi-chart-line', route: '/admin/relatorios/dre' },
            { label: 'Balanço Patrimonial', icon: 'pi pi-wallet', route: '/admin/relatorios/balanco-patrimonial' },
            { label: 'Contas a Pagar', icon: 'pi pi-money-bill', route: '/admin/relatorios/contas-pagar' },
          ]
        },
        { label: 'Contratos', icon: 'pi pi-file-edit', route: '/admin/contratos' },
        { label: 'Usuários', icon: 'pi pi-users', route: '/admin/usuarios' },
        { label: 'Integração SEFAZ', icon: 'pi pi-cloud-download', route: '/admin/sefaz' },
        { label: 'SEFAZ Automático', icon: 'pi pi-clock', route: '/admin/sefaz-automatico' },
        { label: 'Contas a Pagar', icon: 'pi pi-wallet', route: '/admin/contas-pagar' },
        {
          label: 'Configurações', icon: 'pi pi-cog', children: [
            { label: 'Email SMTP', icon: 'pi pi-envelope', route: '/admin/email' },
            { label: 'Integração', icon: 'pi pi-key', route: '/admin/integracao' },
          ]
        },
      ];
    }

    if (this.auth.isDesenvolvedor()) {
      return [
        { label: 'Home', icon: 'pi pi-home', route: '/home' },
        { label: 'Usuários', icon: 'pi pi-users', route: '/dev/usuarios' },
        { label: 'Scripts', icon: 'pi pi-code', route: '/dev/script' },
        { label: 'Monitoramento', icon: 'pi pi-chart-line', route: '/dev/monitoramento' },
      ];
    }

    const itens: MenuItem[] = [
      { label: 'Home', icon: 'pi pi-home', route: '/home' },
      { label: 'Importar XML', icon: 'pi pi-upload', route: '/importacao', tela: 'importacao' },
      { label: 'Integração SEFAZ', icon: 'pi pi-cloud-download', route: '/sefaz', tela: 'sefaz' },
      { label: 'Lançamentos', icon: 'pi pi-pencil', route: '/lancamentos', tela: 'lancamentos' },
      { label: 'Contas a Pagar', icon: 'pi pi-wallet', route: '/contas-pagar', tela: 'contas-pagar' },
      { label: 'Plano de Contas', icon: 'pi pi-sitemap', route: '/plano-contas', tela: 'plano-contas' },
      {
        label: 'Relatórios', icon: 'pi pi-chart-bar', children: [
          { label: 'Balancete', icon: 'pi pi-list', route: '/relatorios/balancete', tela: 'relatorios-balancete' },
          { label: 'Analítico', icon: 'pi pi-search', route: '/relatorios/analitico', tela: 'relatorios-analitico' },
          { label: 'Sintético', icon: 'pi pi-table', route: '/relatorios/sintetico', tela: 'relatorios-sintetico' },
          { label: 'DRE', icon: 'pi pi-chart-line', route: '/relatorios/dre', tela: 'relatorios-dre' },
          { label: 'Balanço Patrimonial', icon: 'pi pi-wallet', route: '/relatorios/balanco-patrimonial', tela: 'relatorios-balanco-patrimonial' },
          { label: 'Contas a Pagar', icon: 'pi pi-money-bill', route: '/relatorios/contas-pagar', tela: 'relatorios-contas-pagar' },
        ]
      },
    ];
    return this.filtrarPorTelas(itens);
  });

  rootMenuItems = computed(() =>
    this.menuItems()
      .map(item => ({
        label: item.label,
        icon: item.icon,
        route: item.route ?? item.children?.[0]?.route,
      }))
      .filter((item): item is { label: string; icon: string; route: string } => item.route != null)
  );

  private filtrarPorTelas(itens: MenuItem[]): MenuItem[] {
    return itens
      .map(item => item.children
        ? { ...item, children: item.children.filter(c => !c.tela || this.auth.temTela(c.tela)) }
        : item)
      .filter(item => item.children
        ? item.children.length > 0
        : !item.tela || this.auth.temTela(item.tela));
  }

  toggleExpand(item: MenuItem): void {
    item.expanded = !item.expanded;
  }

  logout(): void {
    this.auth.logout();
  }
}
