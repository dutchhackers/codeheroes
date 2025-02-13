import { Component, input } from '@angular/core';
import type { IActivity } from '../../core/interfaces';
import { DatePipe } from '@angular/common';
import { mapActivityType } from '../../core/mappings';

@Component({
  selector: 'app-activity-card',
  templateUrl: './activity-card.component.html',
  styles: `
    :host {
      display: block;
    }
  `,
  imports: [DatePipe],
})
export class ActivityCardComponent {
  protected mapActivityType = mapActivityType;

  public activity = input.required<IActivity>();
}
