import { Component } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { environment } from '../../environments/environment';

type EnvironmentName = 'local' | 'test' | 'production';

/** Whether to show environment indicators (banner, etc.) - true for non-production */
export const showEnvironmentIndicator = (environment.name as EnvironmentName) !== 'production';

@Component({
  selector: 'app-environment-banner',
  standalone: true,
  imports: [UpperCasePipe],
  template: `
    @if (showBanner) {
      <div
        class="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-black text-center py-1 px-4 text-sm font-mono"
        role="banner"
        aria-label="Environment indicator"
      >
        {{ environmentName | uppercase }} ENVIRONMENT
      </div>
    }
  `,
})
export class EnvironmentBannerComponent {
  readonly showBanner = showEnvironmentIndicator;
  readonly environmentName = environment.name;
}
