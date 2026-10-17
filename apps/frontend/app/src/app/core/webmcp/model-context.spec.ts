import { DestroyRef } from '@angular/core';
import { clampText, getModelContext, registerWebMcpTools, textResult, WEBMCP_LIMITS } from './model-context';
import { createCompareWithTool, createExplainXpTool, createShowLeaderboardTool } from './code-heroes-tools';
import { RankedRow, WebMcpPeriod } from './webmcp-format';

/** Minimal DestroyRef double: collects callbacks, runs them on destroy(). */
function fakeDestroyRef() {
  const callbacks: (() => void)[] = [];
  const ref = {
    onDestroy: (cb: () => void) => {
      callbacks.push(cb);
      return () => undefined;
    },
    destroyed: false,
  } as unknown as DestroyRef;
  return { ref, destroy: () => callbacks.forEach((cb) => cb()) };
}

function fakeModelContext() {
  const registered: { name: string; signal?: AbortSignal }[] = [];
  return {
    registered,
    registerTool: jest.fn((tool: { name: string }, options?: { signal?: AbortSignal }) => {
      registered.push({ name: tool.name, signal: options?.signal });
      return Promise.resolve();
    }),
  };
}

const rows: RankedRow[] = [
  { id: 'u1', name: 'Ada Hopper', xpGained: 4200, level: 9 },
  { id: 'u2', name: 'Linus Ritchie', xpGained: 3100, level: 7 },
];

describe('model-context', () => {
  it('detects document.modelContext before navigator.modelContext', () => {
    const docCtx = fakeModelContext();
    const navCtx = fakeModelContext();
    expect(getModelContext({ modelContext: docCtx } as never, { modelContext: navCtx } as never)).toBe(docCtx);
    expect(getModelContext({} as never, { modelContext: navCtx } as never)).toBe(navCtx);
    expect(getModelContext({} as never, {} as never)).toBeNull();
  });

  it('clamps output to the budget', () => {
    expect(clampText('x'.repeat(5000)).length).toBe(WEBMCP_LIMITS.output);
    expect(textResult('hi')).toEqual({ content: [{ type: 'text', text: 'hi' }] });
    expect(textResult('bad', true).isError).toBe(true);
  });

  it('is a no-op without a model context', () => {
    const { ref } = fakeDestroyRef();
    expect(() => registerWebMcpTools([], ref, null)).not.toThrow();
  });

  it('aborts the registration signal when the component is destroyed', () => {
    const ctx = fakeModelContext();
    const { ref, destroy } = fakeDestroyRef();
    const tool = createExplainXpTool({
      isLoading: () => false,
      snapshot: () => ({ daily: null, weekly: null, weeklyRank: null }),
      reveal: () => undefined,
    });
    registerWebMcpTools([tool], ref, ctx);
    expect(ctx.registered[0].name).toBe('explain_xp');
    expect(ctx.registered[0].signal?.aborted).toBe(false);
    destroy();
    expect(ctx.registered[0].signal?.aborted).toBe(true);
  });

  it('lets the newest owner of a tool name win', () => {
    const ctx = fakeModelContext();
    const first = fakeDestroyRef();
    const second = fakeDestroyRef();
    const make = () =>
      createShowLeaderboardTool({
        board: 'Heroes',
        activePeriod: () => 'week',
        switchPeriod: () => undefined,
        isLoading: () => false,
        rows: () => rows,
        currentUserId: () => null,
      });
    registerWebMcpTools([make()], first.ref, ctx);
    registerWebMcpTools([make()], second.ref, ctx);
    expect(ctx.registered[0].signal?.aborted).toBe(true);
    // Destroying the older component must not unregister the newer tool.
    first.destroy();
    expect(ctx.registered[1].signal?.aborted).toBe(false);
    second.destroy();
    expect(ctx.registered[1].signal?.aborted).toBe(true);
  });

  it('tool names and descriptions respect the budgets', () => {
    const tools = [
      createShowLeaderboardTool({
        board: 'Heroes',
        activePeriod: () => 'week',
        switchPeriod: () => undefined,
        isLoading: () => false,
        rows: () => rows,
        currentUserId: () => null,
      }),
      createExplainXpTool({
        isLoading: () => false,
        snapshot: () => ({ daily: null, weekly: null, weeklyRank: null }),
        reveal: () => undefined,
      }),
      createCompareWithTool({
        activePeriod: () => 'week',
        isLoading: () => false,
        rows: () => rows,
        currentUserId: () => 'u2',
        highlight: () => undefined,
      }),
    ];
    for (const tool of tools) {
      expect(tool.name.length).toBeLessThanOrEqual(WEBMCP_LIMITS.toolName);
      expect(tool.description.length).toBeLessThanOrEqual(WEBMCP_LIMITS.description);
      for (const prop of Object.values(tool.inputSchema.properties)) {
        expect(String(prop['description']).length).toBeLessThanOrEqual(WEBMCP_LIMITS.paramDescription);
      }
      expect(tool.annotations?.readOnlyHint).toBe(true);
    }
  });
});

describe('code-heroes-tools', () => {
  it('show_leaderboard switches the period and summarises the board', async () => {
    let period: WebMcpPeriod = 'week';
    const switchPeriod = jest.fn((p: WebMcpPeriod) => (period = p));
    const tool = createShowLeaderboardTool({
      board: 'Heroes',
      activePeriod: () => period,
      switchPeriod,
      isLoading: () => false,
      rows: () => rows,
      currentUserId: () => 'u2',
    });
    const result = await tool.execute({ period: 'day' });
    expect(switchPeriod).toHaveBeenCalledWith('day');
    expect(result.content[0].text).toContain('Heroes leaderboard, today');
    expect(result.content[0].text).toContain('You: #2 of 2');

    switchPeriod.mockClear();
    await tool.execute({ period: 'day' });
    expect(switchPeriod).not.toHaveBeenCalled();

    expect((await tool.execute({ period: 'year' })).isError).toBe(true);
  });

  it('show_leaderboard errors when the period changes while loading', async () => {
    let loading = true;
    const tool = createShowLeaderboardTool({
      board: 'Heroes',
      activePeriod: () => 'week', // user flipped back to week meanwhile
      switchPeriod: () => setTimeout(() => (loading = false), 10),
      isLoading: () => loading,
      rows: () => rows,
      currentUserId: () => null,
    });
    const result = await tool.execute({ period: 'day' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('period changed');
  });

  it('explain_xp errors when HQ never finishes loading', async () => {
    jest.useFakeTimers();
    const reveal = jest.fn();
    const tool = createExplainXpTool({
      isLoading: () => true,
      snapshot: () => ({ daily: null, weekly: null, weeklyRank: null }),
      reveal,
    });
    const pending = tool.execute({ period: 'week' });
    await jest.advanceTimersByTimeAsync(9000);
    const result = await pending;
    jest.useRealTimers();
    expect(result.isError).toBe(true);
    expect(reveal).not.toHaveBeenCalled();
  });

  it('explain_xp reveals the matching card', async () => {
    const reveal = jest.fn();
    const tool = createExplainXpTool({
      isLoading: () => false,
      snapshot: () => ({
        daily: { xpEarned: 100, goal: 200, activitiesCount: 1 },
        weekly: null,
        weeklyRank: null,
      }),
      reveal,
    });
    const result = await tool.execute({ period: 'day', compare: true });
    expect(reveal).toHaveBeenCalledWith('day');
    expect(result.content[0].text).toContain('50% done');
  });

  it('compare_with highlights the matched row only', async () => {
    const highlight = jest.fn();
    const tool = createCompareWithTool({
      activePeriod: () => 'week',
      isLoading: () => false,
      rows: () => rows,
      currentUserId: () => 'u2',
      highlight,
    });
    const ok = await tool.execute({ user: 'ada' });
    expect(highlight).toHaveBeenCalledWith('u1');
    expect(ok.content[0].text).toContain('You are behind by 1,100 XP.');

    highlight.mockClear();
    const missing = await tool.execute({ user: 'nobody' });
    expect(missing.isError).toBe(true);
    expect(highlight).not.toHaveBeenCalled();
    expect((await tool.execute({})).isError).toBe(true);
  });
});
