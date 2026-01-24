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
      class="flex items-center gap-6 px-10 py-5 hover:bg-slate-800/50 cursor-pointer transition-colors"
      (click)="selectActivity.emit(activity())"
    >
      <!-- Type Badge -->
      <div
        class="flex-shrink-0 px-5 py-2 rounded-full text-lg font-semibold text-white min-w-[140px] text-center"
        [class]="actionDisplay().color"
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
              class="w-14 h-14 rounded-full"
            />
          } @else {
            <div class="w-14 h-14 rounded-full bg-slate-700 flex items-center justify-center text-2xl font-medium">
              {{ user.displayName.charAt(0).toUpperCase() }}
            </div>
          }
          <span class="text-2xl font-medium truncate">{{ user.displayName }}</span>
        } @else {
          <div class="w-14 h-14 rounded-full bg-slate-700"></div>
          <span class="text-2xl text-slate-500 truncate">Unknown User</span>
        }
      </div>

      <!-- Description (flexible) -->
      <div class="flex-1 text-slate-300 truncate text-xl">
        {{ activity().userFacingDescription }}
      </div>

      <!-- XP Badge -->
      <div class="flex-shrink-0 px-5 py-2 rounded-full bg-amber-500/20 text-amber-400 text-xl font-bold">
        +{{ activity().xp.earned }} XP
      </div>

      <!-- Timestamp -->
      <div class="flex-shrink-0 text-slate-500 text-lg min-w-[100px] text-right">
        {{ formattedTime() }}
      </div>
    </div>
  `,
})
export class ActivityItemComponent {
  activity = input.required<Activity>();
  userInfo = input<UserInfo | null>(null);
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
