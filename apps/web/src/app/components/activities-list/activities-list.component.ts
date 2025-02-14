import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivityCardComponent } from '../activity-card/activity-card.component';
import type { IDayActivity } from '../../core/interfaces';

@Component({
  selector: 'app-activities-list',
  template: `
    @for (dayActivity of activities(); track $index) {
      <h3 class="text-lg font-semibold not-first:mt-8">
        {{ dayActivity.date | date: 'mediumDate' }}
      </h3>
      @for (activity of dayActivity.activities; track activity) {
        <app-activity-card [class.mb-4]="$last === false" [activity]="activity"></app-activity-card>
      }
    }
  `,
  imports: [DatePipe, ActivityCardComponent],
})
export class ActivitiesListComponent {
  public activities = input.required<IDayActivity[]>();
}
