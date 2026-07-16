import { Injectable, inject, signal } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';

export interface ConfirmOptions {
  titulo?: string;
  mensagem: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  perigo?: boolean;
}

interface ConfirmState {
  titulo: string;
  mensagem: string;
  textoConfirmar: string;
  textoCancelar: string;
  perigo: boolean;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  visivel = signal(false);
  estado = signal<ConfirmState>({
    titulo: 'Confirmação',
    mensagem: '',
    textoConfirmar: 'Confirmar',
    textoCancelar: 'Cancelar',
    perigo: false
  });

  private resolver: ((resultado: boolean) => void) | null = null;

  private router = inject(Router);

  constructor() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart && this.visivel()) {
        this.responder(false);
      }
    });
  }

  confirmar(opcoes: ConfirmOptions): Promise<boolean> {
    // Uma confirmacao pendente que for atropelada por outra resolve como cancelada
    this.resolver?.(false);
    this.estado.set({
      titulo: opcoes.titulo ?? 'Confirmação',
      mensagem: opcoes.mensagem,
      textoConfirmar: opcoes.textoConfirmar ?? 'Confirmar',
      textoCancelar: opcoes.textoCancelar ?? 'Cancelar',
      perigo: opcoes.perigo ?? false
    });
    this.visivel.set(true);
    return new Promise<boolean>(resolve => {
      this.resolver = resolve;
    });
  }

  responder(resultado: boolean): void {
    this.visivel.set(false);
    this.resolver?.(resultado);
    this.resolver = null;
  }
}
