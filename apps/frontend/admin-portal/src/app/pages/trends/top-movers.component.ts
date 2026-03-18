import { Component, computed, input } from '@angular/core';
import { TrendsEntityData, TrendsProjectData } from '@codeheroes/types';

export interface TopMoversData {
  biggestClimber: { name: string; rankChange: number } | null;
  mostConsistent: { name: string; activeWeeks: number; totalWeeks: number } | null;
  newInTopTen: { id: string; name: string }[];
}

export function computeTopMovers(
  entities: (TrendsEntityData | TrendsProjectData)[],
  weekIds: string[],
): TopMoversData {
  if (entities.length < 2 || weekIds.length < 2) {
    return { biggestClimber: null, mostConsistent: null, newInTopTen: [] };
  }

  const reversed = [...weekIds].reverse(); // oldest first
  const getName = (e: TrendsEntityData | TrendsProjectData) =>
    'displayName' in e ? e.displayName : e.name;

  // Calculate rank per week
  const getRankForWeek = (weekId: string) => {
    return [...entities]
      .map((e) => ({
        entity: e,
        xp: e.weeklyData.find((w) => w.weekId === weekId)?.xpGained || 0,
      }))
      .sort((a, b) => b.xp - a.xp);
  };

  // Biggest climber: most rank improvement from first to last week
  const firstWeekRanks = getRankForWeek(reversed[0]);
  const lastWeekRanks = getRankForWeek(reversed[reversed.length - 1]);

  let biggestClimber: TopMoversData['biggestClimber'] = null;
  let maxClimb = 0;

  for (const entity of entities) {
    const firstRank = firstWeekRanks.findIndex((r) => r.entity.id === entity.id) + 1;
    const lastRank = lastWeekRanks.findIndex((r) => r.entity.id === entity.id) + 1;
    if (firstRank > 0 && lastRank > 0) {
      const climb = firstRank - lastRank; // positive = moved up
      if (climb > maxClimb) {
        maxClimb = climb;
        biggestClimber = { name: getName(entity), rankChange: climb };
      }
    }
  }

  // Most consistent: entity active in most weeks
  let mostConsistent: TopMoversData['mostConsistent'] = null;
  let maxActiveWeeks = 0;

  for (const entity of entities) {
    const activeWeeks = entity.weeklyData.filter((w) => w.xpGained > 0).length;
    if (activeWeeks > maxActiveWeeks) {
      maxActiveWeeks = activeWeeks;
      mostConsistent = { name: getName(entity), activeWeeks, totalWeeks: weekIds.length };
    }
  }

  // New in top 10: in latest week's top 10 but not in earliest week's top 10
  const firstTop10Ids = new Set(firstWeekRanks.slice(0, 10).filter((r) => r.xp > 0).map((r) => r.entity.id));
  const lastTop10 = lastWeekRanks.slice(0, 10).filter((r) => r.xp > 0);
  const newInTopTen = lastTop10
    .filter((r) => !firstTop10Ids.has(r.entity.id))
    .map((r) => ({ id: r.entity.id, name: getName(r.entity) }));

  return { biggestClimber, mostConsistent, newInTopTen };
}

@Component({
  selector: 'admin-top-movers',
  standalone: true,
  template: `
    <div class="movers-grid">
      <div class="mover-card">
        <span class="mover-label">Biggest Climber</span>
        @if (data().biggestClimber) {
          <span class="mover-stat">+{{ data().biggestClimber!.rankChange }} ranks</span>
          <span class="mover-name">{{ data().biggestClimber!.name }}</span>
        } @else {
          <span class="mover-empty">No data</span>
        }
      </div>
      <div class="mover-card">
        <span class="mover-label">Most Consistent</span>
        @if (data().mostConsistent) {
          <span class="mover-stat">{{ data().mostConsistent!.activeWeeks }}/{{ data().mostConsistent!.totalWeeks }} weeks</span>
          <span class="mover-name">{{ data().mostConsistent!.name }}</span>
        } @else {
          <span class="mover-empty">No data</span>
        }
      </div>
      <div class="mover-card">
        <span class="mover-label">New in Top 10</span>
        @if (data().newInTopTen.length > 0) {
          <span class="mover-stat">{{ data().newInTopTen.length }} newcomers</span>
          <span class="mover-names">{{ topNewcomers() }}@if (overflowCount() > 0) {<span class="mover-overflow"> +{{ overflowCount() }} more</span>}</span>
        } @else {
          <span class="mover-empty">No newcomers</span>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .movers-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
      }
      .mover-card {
        background: var(--theme-color-bg-surface-default);
        border: 1px solid var(--theme-color-border-default-default);
        border-radius: 8px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .mover-label {
        font-size: 13px;
        font-weight: 500;
        color: var(--theme-color-text-neutral-tertiary);
      }
      .mover-stat {
        font-size: 28px;
        font-weight: 700;
        color: var(--theme-color-text-default);
      }
      .mover-name {
        font-size: 14px;
        font-weight: 500;
        color: var(--theme-color-text-neutral-tertiary);
      }
      .mover-names {
        font-size: 14px;
        font-weight: 500;
        color: var(--theme-color-text-neutral-tertiary);
      }
      .mover-overflow {
        color: var(--theme-color-text-brand-default);
      }
      .mover-empty {
        font-size: 14px;
        color: var(--theme-color-text-neutral-tertiary);
      }
    `,
  ],
})
export class TopMoversComponent {
  private static readonly MAX_VISIBLE = 3;

  readonly data = input.required<TopMoversData>();

  readonly topNewcomers = computed(() =>
    this.data().newInTopTen.slice(0, TopMoversComponent.MAX_VISIBLE).map((e) => e.name).join(', '),
  );

  readonly overflowCount = computed(() =>
    Math.max(0, this.data().newInTopTen.length - TopMoversComponent.MAX_VISIBLE),
  );
}
