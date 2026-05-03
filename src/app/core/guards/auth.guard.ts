import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  if (auth.primeiroAcesso() && state.url !== '/alterar-senha') {
    router.navigate(['/alterar-senha']);
    return false;
  }

  return true;
};

export const contadorGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isContador()) return true;

  router.navigate(['/home']);
  return false;
};

export const empresaGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isEmpresa()) return true;

  router.navigate(['/home']);
  return false;
};

export const desenvolvedorGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isDesenvolvedor()) return true;

  router.navigate(['/home']);
  return false;
};
