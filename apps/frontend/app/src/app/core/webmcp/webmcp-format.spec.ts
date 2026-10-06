import {
  findUser,
  formatComparison,
  formatLeaderboardSummary,
  formatXpBreakdown,
  parsePeriod,
  RankedRow,
  safeName,
} from './webmcp-format';
import { WEBMCP_LIMITS } from './model-context';

const rows: RankedRow[] = [
  { id: 'u1', name: 'Ada Hopper', xpGained: 4200, level: 9 },
  { id: 'u2', name: 'Linus Ritchie', xpGained: 3100, level: 7 },
  { id: 'u3', name: 'Grace Lovelace', xpGained: 2500, level: 7 },
  { id: 'u4', name: 'Grace Torvalds', xpGained: 900, level: 3 },
];

describe('webmcp-format', () => {
  it('parses only day and week', () => {
    expect(parsePeriod('day')).toBe('day');
    expect(parsePeriod('week')).toBe('week');
    expect(parsePeriod('month')).toBeNull();
    expect(parsePeriod(undefined)).toBeNull();
  });

  it('quotes, collapses and caps display names', () => {
    expect(safeName('  Ada \n "Hopper" ')).toBe('"Ada Hopper"');
    expect(safeName('')).toBe('"Unknown"');
    expect(safeName('x'.repeat(100)).length).toBeLessThanOrEqual(42);
  });

  describe('formatLeaderboardSummary', () => {
    it('lists the top entries and your rank', () => {
      const text = formatLeaderboardSummary('Heroes', 'day', rows, 'u3', { top: 2 });
      expect(text).toContain('Heroes leaderboard, today (4 entries).');
      expect(text).toContain('1. "Ada Hopper" +4,200 XP');
      expect(text).toContain('2. "Linus Ritchie" +3,100 XP');
      expect(text).not.toContain('Torvalds');
      expect(text).toContain('You: #3 of 4 with +2,500 XP.');
    });

    it('explains a missing rank on a partial board', () => {
      const text = formatLeaderboardSummary('Heroes', 'week', rows.slice(0, 2), 'u4', { partial: true });
      expect(text).toContain('(top 2 entries)');
      expect(text).toContain('You are not in the top 2');
    });

    it('handles an empty board', () => {
      expect(formatLeaderboardSummary('Bots', 'week', [], null)).toBe('Bots leaderboard, this week: no activity yet.');
    });

    it('stays within the output budget', () => {
      const many = Array.from({ length: 200 }, (_, i) => ({ id: `u${i}`, name: 'N'.repeat(40), xpGained: i }));
      expect(formatLeaderboardSummary('Heroes', 'week', many, null, { top: 200 }).length).toBeLessThanOrEqual(
        WEBMCP_LIMITS.output,
      );
    });
  });

  describe('formatXpBreakdown', () => {
    const snapshot = {
      daily: { xpEarned: 3000, goal: 8000, activitiesCount: 4, lastActivity: { type: 'code_push', timestamp: '' } },
      weekly: { xpGained: 12000, prsCreated: 3, prsMerged: 2, reviewsSubmitted: 5, codePushes: 11 },
      weeklyRank: 4,
    };

    it('summarises today, optionally against the goal', () => {
      expect(formatXpBreakdown('day', snapshot)).toBe(
        'Today you earned 3,000 XP from 4 activities. Last activity: code push.',
      );
      expect(formatXpBreakdown('day', snapshot, true)).toContain('Daily goal 8,000 XP: 38% done, 5,000 XP to go.');
    });

    it('reports a reached goal', () => {
      const done = { ...snapshot, daily: { ...snapshot.daily, xpEarned: 9000 } };
      expect(formatXpBreakdown('day', done, true)).toContain('reached (113%), 1,000 XP over.');
    });

    it('summarises the week with the activity breakdown and rank', () => {
      const text = formatXpBreakdown('week', snapshot, true);
      expect(text).toContain('This week you earned 12,000 XP.');
      expect(text).toContain('3 PRs opened, 2 merged, 5 reviews, 11 pushes.');
      expect(text).toContain('You rank #4');
    });

    it('says when data has not loaded', () => {
      expect(formatXpBreakdown('week', { daily: null, weekly: null, weeklyRank: null })).toContain('not loaded');
    });
  });

  describe('findUser / formatComparison', () => {
    it('matches by id, exact name and unique partial name', () => {
      expect(findUser(rows, 'u2')).toMatchObject({ kind: 'found', rank: 2 });
      expect(findUser(rows, 'ada hopper')).toMatchObject({ kind: 'found', rank: 1 });
      expect(findUser(rows, 'ritch')).toMatchObject({ kind: 'found', rank: 2 });
    });

    it('returns candidates when ambiguous and none when unknown', () => {
      const match = findUser(rows, 'grace');
      expect(match.kind).toBe('ambiguous');
      expect(findUser(rows, 'nobody').kind).toBe('none');
      expect(findUser(rows, '  ').kind).toBe('none');
    });

    it('compares you with another hero', () => {
      const result = formatComparison('week', rows, 'u3', 'Linus');
      expect(result.isError).toBe(false);
      expect(result.text).toBe(
        '"Linus Ritchie": #2, +3,100 XP this week, level 7. You: #3, +2,500 XP, level 7. You are behind by 600 XP.',
      );
    });

    it('flags errors for ambiguous or unknown names', () => {
      expect(formatComparison('day', rows, 'u1', 'grace')).toMatchObject({ isError: true });
      expect(formatComparison('day', rows, 'u1', 'zed').text).toContain('No hero matching "zed"');
    });

    it('handles comparing with yourself and being off the board', () => {
      expect(formatComparison('day', rows, 'u1', 'Ada').text).toContain('That is you.');
      expect(formatComparison('day', rows, 'missing', 'Ada').text).toContain('You have no XP');
    });
  });
});
