import { Component } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-environment-banner',
  standalone: true,
  imports: [UpperCasePipe],
  template: `
    @if (showBanner) {
      <div
        class="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-black text-center py-1 px-4 text-sm font-mono"
      >
        {{ environmentName | uppercase }} ENVIRONMENT
      </div>
    }
  `,
})
export class EnvironmentBannerComponent {
  readonly showBanner = (environment.name as string) !== 'production';
  readonly environmentName = environment.name;
}
