import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Activity } from '@codeheroes/types';
import { getActionTypeDisplay } from '../core/mappings/action-type.mapping';
import { UserInfo } from '../core/services/user-cache.service';

@Component({
  selector: 'app-activity-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="flex items-center gap-6 px-10 py-5 cursor-pointer transition-all duration-300 hover:bg-cyan-500/5 border-l-4 border-transparent hover:border-cyan-500/50"
      [class.activity-item-enter]="isNew()"
      (click)="selectActivity.emit(activity())"
    >
      <!-- Type Badge with Neon Glow -->
      <div
        class="flex-shrink-0 px-5 py-2.5 rounded-lg text-lg font-bold text-white w-[200px] text-center uppercase tracking-wide transition-all duration-300"
        [class]="actionDisplay().color + ' ' + actionDisplay().glowClass"
      >
        {{ actionDisplay().label }}
      </div>

      <!-- User Info -->
      <div class="flex items-center gap-4 min-w-[280px]">
        @if (userInfo(); as user) {
          @if (user.photoUrl) {
            <img
              [src]="user.photoUrl"
              [alt]="user.displayName"
              class="w-14 h-14 rounded-full ring-2 ring-cyan-500/30"
            />
          } @else {
            <div class="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-600 to-purple-600 flex items-center justify-center text-2xl font-bold ring-2 ring-cyan-500/30">
              {{ user.displayName.charAt(0).toUpperCase() }}
            </div>
          }
          <span class="text-2xl font-semibold text-white truncate">{{ user.displayName }}</span>
        } @else {
          <div class="w-14 h-14 rounded-full bg-slate-700 ring-2 ring-slate-600"></div>
          <span class="text-2xl text-slate-500 truncate">Unknown User</span>
        }
      </div>

      <!-- Description (flexible) -->
      <div class="flex-1 text-slate-300 truncate text-xl">
        {{ activity().userFacingDescription }}
      </div>

      <!-- XP Badge with Glow -->
      <div class="flex-shrink-0 px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-500/30 to-yellow-500/20 text-yellow-300 text-xl font-black xp-glow border border-yellow-500/30">
        +{{ activity().xp.earned }} XP
      </div>

      <!-- Timestamp -->
      <div class="flex-shrink-0 text-cyan-400/60 text-lg min-w-[100px] text-right font-medium">
        {{ formattedTime() }}
      </div>
    </div>
  `,
})
export class ActivityItemComponent {
  activity = input.required<Activity>();
  userInfo = input<UserInfo | null>(null);
  isNew = input<boolean>(false);
  selectActivity = output<Activity>();

  actionDisplay = computed(() => getActionTypeDisplay(this.activity().sourceActionType));

  formattedTime = computed(() => {
    const date = new Date(this.activity().createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });
}
