import { Component, input } from '@angular/core';
import type { IActivity } from '../../core/interfaces';
import { DatePipe } from '@angular/common';
import { mapActivityType } from '../../core/mappings';
import type { ActivityType } from '../../core/types';
import { SvgIconComponent } from 'angular-svg-icon';

@Component({
  selector: 'app-activity-card',
  templateUrl: './activity-card.component.html',
  styles: `
    :host {
      display: block;
    }
  `,
  imports: [DatePipe, SvgIconComponent],
})
export class ActivityCardComponent {
  protected mapActivityType = mapActivityType;

  protected activityColor: Record<ActivityType, string> = {
    CODE_PUSH: 'bg-yellow-600 dark:bg-yellow-800',
    PR_CREATED: 'bg-green-600 dark:bg-green-800',
    PR_MERGED: 'bg-purple-600 dark:bg-purple-800',
    PR_REVIEW_SUBMITTED: 'bg-blue-500 dark:bg-blue-800',
    PR_REVIEW_THREAD_RESOLVED: 'bg-rose-400 dark:bg-rose-800',
    PR_UPDATED: 'bg-slate-500 dark:bg-slate-800',
    BRANCH_CREATED: 'bg-teal-500 dark:bg-teal-800',
    BRANCH_DELETED: 'bg-red-500 dark:bg-red-800',
  };

  public activity = input.required<IActivity>();
}
