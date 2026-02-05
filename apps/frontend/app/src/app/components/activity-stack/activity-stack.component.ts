import { Component, input, output, signal, computed, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Activity } from '@codeheroes/types';
import { ActivityStack } from '../../core/models/activity-stack.model';
import { StackTimelineComponent } from '../stack-timeline/stack-timeline.component';
import { PRFinalState } from '../../core/constants/stack.constants';

// SVG Icons for the stack
const STACK_ICONS = {
  gitPullRequest: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M13 6h3a2 2 0 0 1 2 2v7"></path><line x1="6" y1="9" x2="6" y2="21"></line></svg>`,
  chevronDown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
  chevronUp: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>`,
};

@Component({
  selector: 'app-activity-stack',
  standalone: true,
  imports: [StackTimelineComponent],
  template: `
    <div
      class="rounded-lg bg-black/70 overflow-hidden transition-all duration-300"
      [class]="stackGlowClass()"
      [class.activity-item-enter]="isNew()"
    >
      <!-- Stack Header (always visible, clickable) -->
      <button
        type="button"
        class="w-full flex items-center gap-3 md:gap-4 p-4 md:p-5 pb-3 md:pb-4 cursor-pointer hover:bg-black/90 transition-colors text-left"
        (click)="toggleExpanded()"
        [attr.aria-expanded]="isExpanded()"
        aria-label="Toggle PR timeline"
      >
        <!-- PR Icon -->
        <div class="w-10 h-10 md:w-12 md:h-12 flex-shrink-0" [class]="stateTextColor()" [innerHTML]="prIcon"></div>

        <!-- Main content -->
        <div class="flex-1 min-w-0" [class]="stateTextColor()">
          <p class="text-base md:text-xl font-medium leading-relaxed">
            PR #{{ stack().prNumber }}: {{ truncatedTitle() }}
          </p>
        </div>

        <!-- Expand/collapse chevron -->
        <div
          class="w-6 h-6 text-slate-500 flex-shrink-0 transition-transform duration-200"
          [class.rotate-180]="isExpanded()"
          [innerHTML]="chevronIcon"
        ></div>
      </button>

      <!-- Footer with separator (before timeline if expanded) -->
      @if (!isExpanded()) {
        <div class="px-4 md:px-5 pb-3 md:pb-4">
          <div
            class="border-t pt-2 md:pt-3 flex items-center justify-between text-xs md:text-sm"
            [style.border-color]="stateBorderColor() + '33'"
          >
            <span class="text-slate-500 truncate">
              {{ stack().repoName }} · {{ stack().activities.length }} events
            </span>
            <span class="text-slate-400 flex-shrink-0 ml-4">+{{ stack().totalXp }} XP</span>
          </div>
        </div>
      }

      <!-- Expanded Timeline -->
      @if (isExpanded()) {
        <div class="px-4 md:px-5 pb-4 md:pb-5 border-t border-slate-800/50">
          <div class="pt-4">
            <app-stack-timeline [activities]="stack().activities" />
          </div>
          <!-- Footer at bottom when expanded -->
          <div
            class="border-t mt-4 pt-2 md:pt-3 flex items-center justify-between text-xs md:text-sm"
            [style.border-color]="stateBorderColor() + '33'"
          >
            <span class="text-slate-500 truncate">
              {{ stack().repoName }} · {{ stack().activities.length }} events
            </span>
            <span class="text-slate-400 flex-shrink-0 ml-4">+{{ stack().totalXp }} XP</span>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class ActivityStackComponent {
  readonly #sanitizer = inject(DomSanitizer);

  stack = input.required<ActivityStack>();
  isNew = input<boolean>(false);
  selectActivity = output<Activity>();

  isExpanded = signal(false);

  // Pre-sanitized icons
  prIcon: SafeHtml;
  chevronIcon: SafeHtml;

  constructor() {
    this.prIcon = this.#sanitizer.bypassSecurityTrustHtml(STACK_ICONS.gitPullRequest);
    this.chevronIcon = this.#sanitizer.bypassSecurityTrustHtml(STACK_ICONS.chevronDown);
  }

  toggleExpanded() {
    this.isExpanded.update((v) => !v);
  }

  stackGlowClass = computed(() => {
    const state = this.stack().finalState;
    return this.getGlowClassForState(state);
  });

  stateTextColor = computed(() => {
    const state = this.stack().finalState;
    return this.getTextColorForState(state);
  });

  stateBorderColor = computed(() => {
    const state = this.stack().finalState;
    return this.getBorderColorForState(state);
  });

  truncatedTitle = computed(() => {
    const title = this.stack().prTitle;
    const maxLength = 60;
    if (title.length <= maxLength) {
      return title;
    }
    return title.substring(0, maxLength) + '...';
  });

  private getGlowClassForState(state: PRFinalState): string {
    switch (state) {
      case 'merged':
        return 'card-glow-green';
      case 'closed':
        return 'card-glow-slate';
      case 'open':
        return 'card-glow-purple';
      default:
        return '';
    }
  }

  private getTextColorForState(state: PRFinalState): string {
    switch (state) {
      case 'merged':
        return 'text-green-400';
      case 'closed':
        return 'text-slate-400';
      case 'open':
        return 'text-purple-400';
      default:
        return 'text-slate-400';
    }
  }

  private getBorderColorForState(state: PRFinalState): string {
    switch (state) {
      case 'merged':
        return '#00ff88';
      case 'closed':
        return '#64748b';
      case 'open':
        return '#bf00ff';
      default:
        return '#64748b';
    }
  }
}
