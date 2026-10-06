/**
 * Pure formatting helpers for the Code Heroes WebMCP tools.
 * Everything here works on data the screen has already loaded; no I/O.
 */
import { clampText } from './model-context';

export type WebMcpPeriod = 'day' | 'week';

export interface RankedRow {
  id: string;
  name: string;
  xpGained: number;
  level?: number;
  totalXp?: number;
}

export interface DailyXpSnapshot {
  xpEarned: number;
  goal: number;
  activitiesCount: number;
  lastActivity?: { type: string; timestamp: string };
}

export interface WeeklyXpSnapshot {
  xpGained: number;
  prsCreated: number;
  prsMerged: number;
  reviewsSubmitted: number;
  codePushes: number;
}

export interface XpSnapshot {
  daily: DailyXpSnapshot | null;
  weekly: WeeklyXpSnapshot | null;
  weeklyRank: number | null;
}

export type UserMatch =
  { kind: 'found'; row: RankedRow; rank: number } | { kind: 'ambiguous'; candidates: RankedRow[] } | { kind: 'none' };

export function parsePeriod(value: unknown): WebMcpPeriod | null {
  return value === 'day' || value === 'week' ? value : null;
}

export function periodLabel(period: WebMcpPeriod): string {
  return period === 'day' ? 'today' : 'this week';
}

export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString('en-US');
}

/** Collapse whitespace and cap length: names are user-controlled content. */
export function safeName(name: string | undefined | null, max = 40): string {
  const cleaned = (name ?? '').replace(/[\s"]+/g, ' ').trim() || 'Unknown';
  const capped = cleaned.length > max ? `${cleaned.slice(0, max - 1)}…` : cleaned;
  return `"${capped}"`;
}

export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

export function formatLeaderboardSummary(
  board: string,
  period: WebMcpPeriod,
  rows: RankedRow[],
  currentUserId: string | null,
  options: { top?: number; partial?: boolean } = {},
): string {
  const top = options.top ?? 5;
  const header = `${board} leaderboard, ${periodLabel(period)}`;
  if (rows.length === 0) return `${header}: no activity yet.`;

  const lines = rows.slice(0, top).map((row, i) => `${i + 1}. ${safeName(row.name)} +${formatNumber(row.xpGained)} XP`);

  let you = '';
  if (currentUserId) {
    const index = rows.findIndex((row) => row.id === currentUserId);
    you =
      index >= 0
        ? `You: #${index + 1} of ${rows.length} with +${formatNumber(rows[index].xpGained)} XP.`
        : options.partial
          ? `You are not in the top ${rows.length}; the full list is at /leaderboard/heroes.`
          : 'You are not on this leaderboard yet.';
  }

  return clampText(
    [
      `${header} (${options.partial ? 'top ' : ''}${rows.length} ${rows.length === 1 ? 'entry' : 'entries'}).`,
      ...lines,
      you,
    ]
      .filter(Boolean)
      .join('\n'),
  );
}

export function formatXpBreakdown(period: WebMcpPeriod, snapshot: XpSnapshot, compare = false): string {
  if (period === 'day') {
    const daily = snapshot.daily;
    if (!daily) return 'Today’s XP has not loaded yet.';
    const parts = [
      `Today you earned ${formatNumber(daily.xpEarned)} XP from ${daily.activitiesCount} ${
        daily.activitiesCount === 1 ? 'activity' : 'activities'
      }.`,
    ];
    if (daily.lastActivity?.type) {
      parts.push(`Last activity: ${daily.lastActivity.type.replace(/_/g, ' ')}.`);
    }
    if (compare && daily.goal > 0) {
      const pct = Math.round((daily.xpEarned / daily.goal) * 100);
      const gap = daily.goal - daily.xpEarned;
      const goal = `Daily goal ${formatNumber(daily.goal)} XP`;
      parts.push(
        gap > 0
          ? `${goal}: ${pct}% done, ${formatNumber(gap)} XP to go.`
          : gap === 0
            ? `${goal} reached exactly.`
            : `${goal} reached (${pct}%), ${formatNumber(-gap)} XP over.`,
      );
    }
    return clampText(parts.join(' '));
  }

  const weekly = snapshot.weekly;
  if (!weekly) return 'This week’s XP has not loaded yet.';
  const parts = [
    `This week you earned ${formatNumber(weekly.xpGained)} XP.`,
    `Breakdown by activity: ${plural(weekly.prsCreated, 'PR')} opened, ${weekly.prsMerged} merged, ` +
      `${plural(weekly.reviewsSubmitted, 'review')}, ${plural(weekly.codePushes, 'push', 'pushes')}.`,
  ];
  if (compare) {
    parts.push(
      snapshot.weeklyRank
        ? `You rank #${snapshot.weeklyRank} on this week’s Heroes leaderboard.`
        : 'You are not ranked on this week’s Heroes leaderboard yet.',
    );
  }
  return clampText(parts.join(' '));
}

/** Resolve a user by id or (partial, case-insensitive) display name. */
export function findUser(rows: RankedRow[], query: string): UserMatch {
  const q = query.trim().toLowerCase();
  if (!q) return { kind: 'none' };

  const withRank = (row: RankedRow): UserMatch => ({ kind: 'found', row, rank: rows.indexOf(row) + 1 });

  const byId = rows.find((row) => row.id.toLowerCase() === q);
  if (byId) return withRank(byId);

  const exact = rows.filter((row) => row.name.toLowerCase() === q);
  if (exact.length === 1) return withRank(exact[0]);

  const partial = exact.length > 1 ? exact : rows.filter((row) => row.name.toLowerCase().includes(q));
  if (partial.length === 1) return withRank(partial[0]);
  if (partial.length > 1) return { kind: 'ambiguous', candidates: partial.slice(0, 5) };
  return { kind: 'none' };
}

export function formatComparison(
  period: WebMcpPeriod,
  rows: RankedRow[],
  currentUserId: string | null,
  query: string,
): { text: string; isError: boolean } {
  const match = findUser(rows, query);
  if (match.kind === 'none') {
    return {
      text: `No hero matching ${safeName(query)} on the leaderboard ${periodLabel(period)}.`,
      isError: true,
    };
  }
  if (match.kind === 'ambiguous') {
    return {
      text: `Several heroes match ${safeName(query)}: ${match.candidates
        .map((row) => safeName(row.name))
        .join(', ')}. Ask again with a more specific name.`,
      isError: true,
    };
  }
  return { text: clampText(describeComparison(period, rows, currentUserId, match)), isError: false };
}

function describeComparison(
  period: WebMcpPeriod,
  rows: RankedRow[],
  currentUserId: string | null,
  match: { row: RankedRow; rank: number },
): string {
  const them = match.row;
  const themLine = `${safeName(them.name)}: #${match.rank}, +${formatNumber(them.xpGained)} XP ${periodLabel(period)}${
    them.level ? `, level ${them.level}` : ''
  }.`;

  const meIndex = currentUserId ? rows.findIndex((row) => row.id === currentUserId) : -1;
  if (meIndex < 0) {
    return `${themLine} You have no XP on this leaderboard ${periodLabel(period)} yet.`;
  }
  if (rows[meIndex].id === them.id) {
    return `${themLine} That is you.`;
  }

  const me = rows[meIndex];
  const diff = me.xpGained - them.xpGained;
  const verdict =
    diff === 0
      ? 'You are tied.'
      : diff > 0
        ? `You are ahead by ${formatNumber(diff)} XP.`
        : `You are behind by ${formatNumber(-diff)} XP.`;
  const levelLine =
    me.level && them.level && me.level !== them.level ? ` Level: you ${me.level}, them ${them.level}.` : '';

  return `${themLine} You: #${meIndex + 1}, +${formatNumber(me.xpGained)} XP${
    me.level ? `, level ${me.level}` : ''
  }. ${verdict}${levelLine}`;
}
