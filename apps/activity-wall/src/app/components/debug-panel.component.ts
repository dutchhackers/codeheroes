import { Component, input, output, computed } from '@angular/core';

import { Activity } from '@codeheroes/types';

@Component({
  selector: 'app-debug-panel',
  standalone: true,
  imports: [],
  template: `
    <div class="fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700 transition-transform duration-300"
         [class.translate-y-full]="!isOpen()"
         [class.translate-y-0]="isOpen()">
      <!-- Toggle Bar -->
      <button
        class="w-full px-4 py-2 flex items-center justify-between bg-slate-800 hover:bg-slate-700 transition-colors"
        (click)="togglePanel.emit()"
      >
        <span class="text-sm font-medium text-slate-400">
          Debug Panel
          @if (selectedActivity(); as activity) {
            <span class="text-slate-500 ml-2">- {{ activity.sourceActionType }}</span>
          }
        </span>
        <span class="text-slate-500">{{ isOpen() ? '(Press D to close)' : '(Press D to open)' }}</span>
      </button>

      <!-- Content -->
      @if (isOpen()) {
        <div class="p-4 max-h-[40vh] overflow-auto">
          @if (selectedActivity(); as activity) {
            <pre class="text-xs text-slate-300 font-mono whitespace-pre-wrap">{{ formattedJson() }}</pre>
          } @else {
            <p class="text-slate-500 text-center">Click an activity to view its details</p>
          }
        </div>
      }
    </div>
  `,
})
export class DebugPanelComponent {
  isOpen = input(false);
  selectedActivity = input<Activity | null>(null);
  togglePanel = output<void>();

  formattedJson = computed(() => {
    const activity = this.selectedActivity();
    if (!activity) return '';
    return JSON.stringify(activity, null, 2);
  });
}
