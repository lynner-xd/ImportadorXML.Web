import { Routes } from '@angular/router';
import { authGuard, contadorGuard, empresaGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { LoginComponent } from './pages/login/login';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', loadComponent: () => import('./pages/home/home').then(m => m.HomeComponent) },
      { path: 'alterar-senha', loadComponent: () => import('./pages/alterar-senha/alterar-senha').then(m => m.AlterarSenhaComponent) },

      // Empresa
      { path: 'importacao', canActivate: [empresaGuard], loadComponent: () => import('./pages/importacao/importacao').then(m => m.ImportacaoComponent) },
      { path: 'lancamentos', canActivate: [empresaGuard], loadComponent: () => import('./pages/lancamentos/lancamentos').then(m => m.LancamentosComponent) },
      { path: 'plano-contas', canActivate: [empresaGuard], loadComponent: () => import('./pages/plano-contas/plano-contas').then(m => m.PlanoContasComponent) },
      { path: 'relatorios/balancete', canActivate: [empresaGuard], loadComponent: () => import('./pages/relatorios/balancete').then(m => m.BalanceteComponent) },
      { path: 'relatorios/analitico', canActivate: [empresaGuard], loadComponent: () => import('./pages/relatorios/analitico').then(m => m.AnaliticoComponent) },
      { path: 'relatorios/sintetico', canActivate: [empresaGuard], loadComponent: () => import('./pages/relatorios/sintetico').then(m => m.SinteticoComponent) },

      // Contador (Admin)
      { path: 'admin/relatorios/balancete', canActivate: [contadorGuard], loadComponent: () => import('./pages/admin-relatorios/admin-balancete').then(m => m.AdminBalanceteComponent) },
      { path: 'admin/relatorios/analitico', canActivate: [contadorGuard], loadComponent: () => import('./pages/admin-relatorios/admin-analitico').then(m => m.AdminAnaliticoComponent) },
      { path: 'admin/relatorios/sintetico', canActivate: [contadorGuard], loadComponent: () => import('./pages/admin-relatorios/admin-sintetico').then(m => m.AdminSinteticoComponent) },
      { path: 'admin/usuarios', canActivate: [contadorGuard], loadComponent: () => import('./pages/admin-usuarios/admin-usuarios').then(m => m.AdminUsuariosComponent) },
      { path: 'admin/email', canActivate: [contadorGuard], loadComponent: () => import('./pages/admin-email/admin-email').then(m => m.AdminEmailComponent) },
    ]
  },
  { path: '**', redirectTo: 'login' }
];
