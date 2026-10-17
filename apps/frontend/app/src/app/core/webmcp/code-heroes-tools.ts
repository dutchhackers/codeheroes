/**
 * Code Heroes WebMCP tool definitions.
 *
 * Factories take small accessor callbacks so the components stay the source of
 * truth (signals) and the tools stay testable without TestBed.
 */
import { textResult, waitUntil, WebMcpTool } from './model-context';
import {
  formatComparison,
  formatLeaderboardSummary,
  findUser,
  formatXpBreakdown,
  parsePeriod,
  RankedRow,
  WebMcpPeriod,
  XpSnapshot,
} from './webmcp-format';

const PERIOD_SCHEMA = {
  type: 'string',
  enum: ['day', 'week'],
  description: "Leaderboard period: 'day' (today) or 'week' (this ISO week).",
} as const;

export interface ShowLeaderboardDeps {
  /** Human name of the board on screen, e.g. "Heroes". */
  board: string;
  activePeriod: () => WebMcpPeriod;
  switchPeriod: (period: WebMcpPeriod) => void;
  isLoading: () => boolean;
  rows: () => RankedRow[];
  currentUserId: () => string | null;
  /** True when the screen only loads the top N (overview page). */
  partial?: boolean;
}

export function createShowLeaderboardTool(deps: ShowLeaderboardDeps): WebMcpTool<{ period?: unknown }> {
  return {
    name: 'show_leaderboard',
    title: 'Show leaderboard',
    description:
      'Switch the visible Code Heroes leaderboard to today or this week and return the top 5 with XP gained, ' +
      'plus your own rank. Changes only what is shown on screen.',
    inputSchema: {
      type: 'object',
      properties: { period: PERIOD_SCHEMA },
      required: ['period'],
      additionalProperties: false,
    },
    // Read-only: it flips the on-screen period toggle, it never writes data.
    // Display names are user-controlled, hence untrustedContentHint.
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    execute: async (input) => {
      const period = parsePeriod(input?.period);
      if (!period) return textResult("Invalid period. Use 'day' or 'week'.", true);

      if (period !== deps.activePeriod()) deps.switchPeriod(period);
      const loaded = await waitUntil(() => !deps.isLoading());
      if (!loaded) return textResult('The leaderboard is still loading. Try again in a moment.', true);
      // The period can change while we wait (user click or a concurrent call): never mislabel rows.
      if (deps.activePeriod() !== period) {
        return textResult('The visible period changed while loading. Call show_leaderboard again.', true);
      }

      return textResult(
        formatLeaderboardSummary(deps.board, period, deps.rows(), deps.currentUserId(), { partial: deps.partial }),
      );
    },
  };
}

export interface ExplainXpDeps {
  snapshot: () => XpSnapshot;
  isLoading: () => boolean;
  /** Scroll/highlight the card that holds this period's numbers. */
  reveal: (period: WebMcpPeriod) => void;
}

export function createExplainXpTool(deps: ExplainXpDeps): WebMcpTool<{ period?: unknown; compare?: unknown }> {
  return {
    name: 'explain_xp',
    title: 'Explain my XP',
    description:
      "Summarise the signed-in hero's XP for today or this week from the HQ cards already on screen " +
      '(XP, activity counts, PRs, reviews, pushes) and scroll that card into view.',
    inputSchema: {
      type: 'object',
      properties: {
        period: PERIOD_SCHEMA,
        compare: {
          type: 'boolean',
          description: "Also compare: 'day' against your daily XP goal, 'week' against your weekly Heroes rank.",
        },
      },
      required: ['period'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    execute: async (input) => {
      const period = parsePeriod(input?.period);
      if (!period) return textResult("Invalid period. Use 'day' or 'week'.", true);

      const loaded = await waitUntil(() => !deps.isLoading());
      if (!loaded) return textResult('HQ is still loading. Try again in a moment.', true);
      deps.reveal(period);
      return textResult(formatXpBreakdown(period, deps.snapshot(), input?.compare === true));
    },
  };
}

export interface CompareWithDeps {
  activePeriod: () => WebMcpPeriod;
  isLoading: () => boolean;
  rows: () => RankedRow[];
  currentUserId: () => string | null;
  /** Highlight and scroll to the matched row. */
  highlight: (id: string) => void;
}

export function createCompareWithTool(deps: CompareWithDeps): WebMcpTool<{ user?: unknown }> {
  return {
    name: 'compare_with',
    title: 'Compare with a hero',
    description:
      'Compare your XP on the visible Heroes leaderboard (current period) with another hero, found by display ' +
      'name or user id. Highlights their row on screen.',
    inputSchema: {
      type: 'object',
      properties: {
        user: {
          type: 'string',
          description: 'Display name (full or partial, case-insensitive) or user id of the hero to compare with.',
          minLength: 1,
          maxLength: 80,
        },
      },
      required: ['user'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    execute: async (input) => {
      const query = typeof input?.user === 'string' ? input.user.slice(0, 80) : '';
      if (!query.trim()) return textResult('Provide the name of a hero to compare with.', true);

      const loaded = await waitUntil(() => !deps.isLoading());
      if (!loaded) return textResult('The leaderboard is still loading. Try again in a moment.', true);

      const rows = deps.rows();
      const result = formatComparison(deps.activePeriod(), rows, deps.currentUserId(), query);
      const match = findUser(rows, query);
      if (match.kind === 'found') deps.highlight(match.row.id);
      return textResult(result.text, result.isError);
    },
  };
}
