import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-level-badge',
  template: `<div
    class="flex items-center justify-center rounded-full border-2 border-primary font-semibold bg-white color-primary dark:bg-slate-800"
    [ngClass]="{
      'w-7 h-7 text-xs': size() === 'small',
      'w-10 h-10 text-md': size() === 'medium',
    }"
  >
    {{ level() }}
  </div>`,
  imports: [NgClass],
})
export class LevelBadgeComponent {
  public level = input<number>(0);
  public size = input<'small' | 'medium' | 'large'>('medium');
}
