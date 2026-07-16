import { Component, ElementRef, HostListener, ViewChild, effect } from '@angular/core';
import { ConfirmService } from '../../core/services/confirm.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss'
})
export class ConfirmDialogComponent {
  @ViewChild('btnConfirmar') btnConfirmar?: ElementRef<HTMLButtonElement>;

  private elementoAnterior: HTMLElement | null = null;

  constructor(public confirm: ConfirmService) {
    effect(() => {
      if (this.confirm.visivel()) {
        this.elementoAnterior = document.activeElement as HTMLElement | null;
        setTimeout(() => this.btnConfirmar?.nativeElement.focus());
      } else {
        this.elementoAnterior?.focus();
        this.elementoAnterior = null;
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.confirm.visivel()) {
      this.confirm.responder(false);
    }
  }
}
