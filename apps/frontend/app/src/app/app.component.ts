import { Component } from '@angular/core';
import { ShellComponent } from './layout/shell.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ShellComponent],
  template: `<app-shell />`,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class AppComponent {}
