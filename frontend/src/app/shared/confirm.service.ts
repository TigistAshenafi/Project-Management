import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  visible = false;
  title: string | null = null;
  message = 'This action cannot be undone. Do you want to delete this item?';

  private resolver: ((value: boolean) => void) | null = null;

  confirm(message?: string, title?: string): Promise<boolean> {
    this.message = message || this.message;
    this.title = title || 'Please confirm';
    this.visible = true;

    return new Promise<boolean>((resolve) => {
      this.resolver = resolve;
    });
  }

  ok() {
    if (this.resolver) this.resolver(true);
    this.reset();
  }

  cancel() {
    if (this.resolver) this.resolver(false);
    this.reset();
  }

  private reset() {
    this.visible = false;
    this.title = null;
    this.message = 'This action cannot be undone. Do you want to delete this item?';
    this.resolver = null;
  }
}


