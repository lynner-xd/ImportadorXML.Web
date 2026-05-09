import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { Observable } from 'rxjs';

export interface CanDeactivateComponent {
  canDeactivate(): boolean | Observable<boolean>;
}

@Injectable({ providedIn: 'root' })
export class CanDeactivateGuard implements CanDeactivate<CanDeactivateComponent> {
  canDeactivate(component: CanDeactivateComponent): boolean | Observable<boolean> {
    return component.canDeactivate();
  }
}
