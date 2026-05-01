import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, AlterarSenhaRequest } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  private _user = signal<LoginResponse | null>(this.loadUser());

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());
  readonly role = computed(() => this._user()?.role ?? '');
  readonly isContador = computed(() => this.role() === 'Contador');
  readonly isEmpresa = computed(() => this.role() === 'Empresa');
  readonly primeiroAcesso = computed(() => this._user()?.primeiroAcesso ?? false);

  constructor(private http: HttpClient, private router: Router) {}

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, request).pipe(
      tap(response => {
        localStorage.setItem(this.TOKEN_KEY, response.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(response));
        this._user.set(response);
      })
    );
  }

  alterarSenha(request: AlterarSenhaRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/usuario/senha`, request);
  }

  marcarSenhaAlterada(): void {
    const user = this._user();
    if (!user) return;
    const updated = { ...user, primeiroAcesso: false };
    localStorage.setItem(this.USER_KEY, JSON.stringify(updated));
    this._user.set(updated);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private loadUser(): LoginResponse | null {
    const data = localStorage.getItem(this.USER_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
}
