import type { ElementRef } from '@angular/core';
import { Component, input, viewChild } from '@angular/core';
import { InViewDirective } from '../../core/directives';

@Component({
  selector: 'app-progress-bar',
  template: `<div
    appInView
    (inView)="animate()"
    class="overflow-hidden bg-gray-300 dark:bg-gray-400 relative"
    [class.h-4]="size() === 'medium'"
    [class.h-8]="size() === 'large'"
    [class.h-12]="size() === 'extra-large'"
    [class.rounded-full]="rounded()"
  >
    <div
      #progressBar
      class="absolute top-0 left-0 bottom-0 bg-primary rounded-[inherit] w-0 before:w-2 before:bg-inherit before:-skew-x-8 before:absolute before:-right-1 before:top-0 before:bottom-0"
      style="transition: width .75s .5s;"
    ></div>
  </div>`,
  imports: [InViewDirective],
})
export class ProgressBarComponent {
  protected progressBar = viewChild.required<ElementRef<HTMLElement>>('progressBar');

  public percentage = input(0);
  public rounded = input(true);
  public size = input<'medium' | 'large' | 'extra-large'>('medium');

  public animate() {
    this.progressBar().nativeElement.style.width = `${this.percentage()}%`;
  }
}
