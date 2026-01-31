import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-notification',
  template: `
    @let notificationType = type();

    <div
      class="text-sm font-semibold rounded-md p-4 dark:!text-white"
      [ngClass]="{
        'bg-red-200 text-red-800 dark:bg-red-950': notificationType === 'error',
        'bg-green-200 text-green-800 dark:bg-green-950': notificationType === 'success',
        'bg-blue-200 text-blue-800 dark:bg-blue-950': notificationType === 'info',
        'bg-orange-200 text-orange-800 dark:bg-orange-900': notificationType === 'warning',
      }"
    >
      <ng-content></ng-content>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  imports: [NgClass],
})
export class NotificationComponent {
  public type = input<'success' | 'error' | 'info' | 'warning'>('info');
}
