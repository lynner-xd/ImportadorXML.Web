import { Routes } from '@angular/router';
import { authGuard, contadorGuard, empresaGuard, desenvolvedorGuard } from './core/guards/auth.guard';
import { CanDeactivateGuard } from './core/guards/can-deactivate.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { LoginComponent } from './pages/login/login';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'docs-api', loadComponent: () => import('./pages/docs-api/docs-api').then(m => m.DocsApiComponent) },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', loadComponent: () => import('./pages/home/home').then(m => m.HomeComponent) },
      { path: 'alterar-senha', loadComponent: () => import('./pages/alterar-senha/alterar-senha').then(m => m.AlterarSenhaComponent) },

      // Empresa
      // Empresa — Importação
      { path: 'importacao', canActivate: [empresaGuard], loadComponent: () => import('./pages/importacao/importacao').then(m => m.ImportacaoComponent) },
      { path: 'importacao/entrada', canActivate: [empresaGuard], canDeactivate: [CanDeactivateGuard], data: { tipo: 'Entrada' }, loadComponent: () => import('./pages/importacao/importacao-form/importacao-form').then(m => m.ImportacaoFormComponent) },
      { path: 'importacao/saida', canActivate: [empresaGuard], canDeactivate: [CanDeactivateGuard], data: { tipo: 'Saida' }, loadComponent: () => import('./pages/importacao/importacao-form/importacao-form').then(m => m.ImportacaoFormComponent) },
      { path: 'lancamentos', canActivate: [empresaGuard], loadComponent: () => import('./pages/lancamentos/lancamentos').then(m => m.LancamentosComponent) },
      { path: 'importacao-config', canActivate: [empresaGuard], loadComponent: () => import('./pages/importacao-config/importacao-config').then(m => m.ImportacaoConfigComponent) },
      { path: 'importacao-extrato', canActivate: [empresaGuard], loadComponent: () => import('./pages/importacao-extrato/importacao-extrato').then(m => m.ImportacaoExtratoComponent) },
      { path: 'plano-contas', canActivate: [empresaGuard], loadComponent: () => import('./pages/plano-contas/plano-contas').then(m => m.PlanoContasComponent) },
      { path: 'sefaz', canActivate: [empresaGuard], loadComponent: () => import('./pages/sefaz/sefaz').then(m => m.SefazComponent) },
      { path: 'relatorios/balancete', canActivate: [empresaGuard], loadComponent: () => import('./pages/relatorios/balancete').then(m => m.BalanceteComponent) },
      { path: 'relatorios/analitico', canActivate: [empresaGuard], loadComponent: () => import('./pages/relatorios/analitico').then(m => m.AnaliticoComponent) },
      { path: 'relatorios/sintetico', canActivate: [empresaGuard], loadComponent: () => import('./pages/relatorios/sintetico').then(m => m.SinteticoComponent) },
      { path: 'relatorios/dre', canActivate: [empresaGuard], loadComponent: () => import('./pages/relatorios/dre').then(m => m.DreComponent) },
      { path: 'relatorios/balanco-patrimonial', canActivate: [empresaGuard], loadComponent: () => import('./pages/relatorios/balanco-patrimonial').then(m => m.BalancoPatrimonialComponent) },

      // Contador (Admin)
      { path: 'admin/relatorios/balancete', canActivate: [contadorGuard], loadComponent: () => import('./pages/admin-relatorios/admin-balancete').then(m => m.AdminBalanceteComponent) },
      { path: 'admin/relatorios/analitico', canActivate: [contadorGuard], loadComponent: () => import('./pages/admin-relatorios/admin-analitico').then(m => m.AdminAnaliticoComponent) },
      { path: 'admin/relatorios/sintetico', canActivate: [contadorGuard], loadComponent: () => import('./pages/admin-relatorios/admin-sintetico').then(m => m.AdminSinteticoComponent) },
      { path: 'admin/relatorios/dre', canActivate: [contadorGuard], loadComponent: () => import('./pages/admin-relatorios/admin-dre').then(m => m.AdminDreComponent) },
      { path: 'admin/relatorios/balanco-patrimonial', canActivate: [contadorGuard], loadComponent: () => import('./pages/admin-relatorios/admin-balanco-patrimonial').then(m => m.AdminBalancoPatrimonialComponent) },
      { path: 'admin/contratos', canActivate: [contadorGuard], loadComponent: () => import('./pages/admin-contratos/admin-contratos').then(m => m.AdminContratosComponent) },
      { path: 'admin/usuarios', canActivate: [contadorGuard], loadComponent: () => import('./pages/admin-usuarios/admin-usuarios').then(m => m.AdminUsuariosComponent) },
      { path: 'admin/email', canActivate: [contadorGuard], loadComponent: () => import('./pages/admin-email/admin-email').then(m => m.AdminEmailComponent) },
      { path: 'admin/integracao', canActivate: [contadorGuard], loadComponent: () => import('./pages/admin-integracao/admin-integracao').then(m => m.AdminIntegracaoComponent) },
      { path: 'admin/sefaz', canActivate: [contadorGuard], loadComponent: () => import('./pages/admin-sefaz/admin-sefaz').then(m => m.AdminSefazComponent) },

      // Desenvolvedor
      { path: 'dev/usuarios', canActivate: [desenvolvedorGuard], loadComponent: () => import('./pages/dev-usuarios/dev-usuarios').then(m => m.DevUsuariosComponent) },
      { path: 'dev/script', canActivate: [desenvolvedorGuard], loadComponent: () => import('./pages/dev-script/dev-script').then(m => m.DevScriptComponent) },
      { path: 'dev/monitoramento', canActivate: [desenvolvedorGuard], loadComponent: () => import('./pages/dev-monitoramento/dev-monitoramento').then(m => m.DevMonitoramentoComponent) },
    ]
  },
  { path: '**', redirectTo: 'login' }
];
