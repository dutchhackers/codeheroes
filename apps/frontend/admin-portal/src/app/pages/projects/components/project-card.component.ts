import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ProjectSummaryDto } from '@codeheroes/types';

@Component({
  selector: 'admin-project-card',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div class="bg-white rounded-lg border border-slate-200 p-5 hover:shadow-sm transition-shadow">
      <div class="flex items-start justify-between mb-3">
        <div>
          <h3 class="text-base font-semibold text-slate-900">{{ project().name }}</h3>
          <p class="text-xs text-slate-400 font-mono">{{ project().slug }}</p>
        </div>
      </div>
      @if (project().description) {
        <p class="text-sm text-slate-600 mb-4 line-clamp-2">{{ project().description }}</p>
      }
      <div class="grid grid-cols-2 gap-3">
        <div class="bg-slate-50 rounded px-3 py-2">
          <p class="text-xs text-slate-500">Repositories</p>
          <p class="text-lg font-semibold text-slate-900">{{ project().repositoryCount }}</p>
        </div>
        <div class="bg-slate-50 rounded px-3 py-2">
          <p class="text-xs text-slate-500">Total XP</p>
          <p class="text-lg font-semibold text-slate-900">{{ project().totalXp | number }}</p>
        </div>
        <div class="bg-slate-50 rounded px-3 py-2">
          <p class="text-xs text-slate-500">Actions</p>
          <p class="text-lg font-semibold text-slate-900">{{ project().totalActions | number }}</p>
        </div>
        <div class="bg-slate-50 rounded px-3 py-2">
          <p class="text-xs text-slate-500">Members</p>
          <p class="text-lg font-semibold text-slate-900">{{ project().activeMemberCount }}</p>
        </div>
      </div>
    </div>
  `,
})
export class ProjectCardComponent {
  readonly project = input.required<ProjectSummaryDto>();
}
