import { Component, computed, input } from '@angular/core';
import type { IUser } from '../../core/interfaces';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-avatar',
  template: ` @let user = this.user();
    @if (user && user.photoUrl) {
      <img
        [src]="user.photoUrl"
        [alt]="user.displayName"
        class="rounded-full border border-slate-200"
        [ngClass]="{
          'h-24 w-24 ': size() === 'large',
          'h-16 w-16': size() === 'medium',
          'h-10 w-10': size() === 'medium',
        }"
      />
    } @else {
      <div
        class="rounded-full flex items-center justify-center font-semibold border-2 border-primary bg-white dark:bg-black"
        [ngClass]="{
          'h-24 w-24 text-2xl': size() === 'large',
          'h-16 w-16 text-md': size() === 'medium',
          'h-10 w-10 text-sm': size() === 'small',
        }"
      >
        {{ initials() }}
      </div>
    }`,
  imports: [NgClass],
})
export class AvatarComponent {
  public user = input.required<IUser | null>();
  public size = input<'small' | 'medium' | 'large'>('medium');

  public initials = computed(() => {
    const user = this.user();

    if (!user?.displayName) {
      return '-';
    }

    return user?.displayName
      .split(' ')
      .map((part) => part[0])
      .join('');
  });
}
