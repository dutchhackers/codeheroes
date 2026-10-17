import { DestroyRef } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Minimal local typings for the WebMCP draft API
 * (https://webmachinelearning.github.io/webmcp/).
 *
 * The browser exposes `document.modelContext` (older builds: `navigator.modelContext`).
 * When neither exists, every helper in this file is a silent no-op.
 */
export interface WebMcpToolAnnotations {
  readOnlyHint?: boolean;
  untrustedContentHint?: boolean;
  consequentialHint?: boolean;
}

export interface WebMcpTextResult {
  content: { type: 'text'; text: string }[];
  isError?: boolean;
}

export interface WebMcpJsonSchema {
  type: 'object';
  properties: Record<string, Record<string, unknown>>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface WebMcpTool<TInput = Record<string, unknown>> {
  name: string;
  title?: string;
  description: string;
  inputSchema: WebMcpJsonSchema;
  annotations?: WebMcpToolAnnotations;
  execute: (input: TInput) => Promise<WebMcpTextResult>;
}

/** A tool with any input type (`never` accepts every execute signature). */
export type AnyWebMcpTool = WebMcpTool<never>;

interface ModelContextLike {
  registerTool(tool: AnyWebMcpTool, options?: { signal?: AbortSignal }): Promise<void> | void;
  /** Present on early Chromium builds only. */
  unregisterTool?(name: string): void;
}

/** Budgets recommended by the WebMCP explainer / agent integrations. */
export const WEBMCP_LIMITS = {
  toolName: 30,
  description: 500,
  paramDescription: 150,
  output: 1500,
} as const;

/** Debug registry: lets headless browsers (no WebMCP) call tools in local dev. */
const DEBUG_GLOBAL = '__codeheroesWebMcp';

export function getModelContext(
  doc: Document | undefined = typeof document !== 'undefined' ? document : undefined,
  nav: Navigator | undefined = typeof navigator !== 'undefined' ? navigator : undefined,
): ModelContextLike | null {
  const fromDocument = (doc as unknown as { modelContext?: ModelContextLike } | undefined)?.modelContext;
  if (fromDocument && typeof fromDocument.registerTool === 'function') return fromDocument;
  const fromNavigator = (nav as unknown as { modelContext?: ModelContextLike } | undefined)?.modelContext;
  if (fromNavigator && typeof fromNavigator.registerTool === 'function') return fromNavigator;
  return null;
}

export function textResult(text: string, isError = false): WebMcpTextResult {
  const result: WebMcpTextResult = { content: [{ type: 'text', text: clampText(text) }] };
  if (isError) result.isError = true;
  return result;
}

/** Keep tool output within the WebMCP output budget. */
export function clampText(text: string, max: number = WEBMCP_LIMITS.output): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

/** One AbortController per registered tool name, so the newest owner wins. */
const activeRegistrations = new Map<string, AbortController>();

/**
 * Register WebMCP tools for the lifetime of a component.
 *
 * Each tool is unregistered through an AbortController that fires when the
 * component's DestroyRef is destroyed, so an agent only sees tools for the
 * screen the user is actually on. If two components register the same tool
 * name (Angular can create the next route's component before destroying the
 * previous one), the newest registration replaces the older one.
 */
export function registerWebMcpTools(
  tools: AnyWebMcpTool[],
  destroyRef: DestroyRef,
  modelContext: ModelContextLike | null = getModelContext(),
): void {
  exposeForLocalDebugging(tools, destroyRef);
  if (!modelContext) return;

  const owned = new Map<string, AbortController>();
  for (const tool of tools) {
    releaseRegistration(tool.name, activeRegistrations.get(tool.name), modelContext);
    const controller = new AbortController();
    activeRegistrations.set(tool.name, controller);
    owned.set(tool.name, controller);
    try {
      const result = modelContext.registerTool(tool, { signal: controller.signal });
      if (result && typeof (result as Promise<void>).catch === 'function') {
        (result as Promise<void>).catch((error) => console.warn(`[webmcp] could not register ${tool.name}`, error));
      }
    } catch (error) {
      console.warn(`[webmcp] could not register ${tool.name}`, error);
    }
  }

  destroyRef.onDestroy(() => {
    for (const [name, controller] of owned) {
      // Only unregister if a newer component has not taken the name over.
      if (activeRegistrations.get(name) === controller) releaseRegistration(name, controller, modelContext);
    }
  });
}

function releaseRegistration(
  name: string,
  controller: AbortController | undefined,
  modelContext: ModelContextLike,
): void {
  if (!controller || controller.signal.aborted) return;
  controller.abort();
  if (activeRegistrations.get(name) === controller) activeRegistrations.delete(name);
  // Early Chromium builds ignore the signal; unregister explicitly there.
  if (typeof modelContext.unregisterTool === 'function') {
    try {
      modelContext.unregisterTool(name);
    } catch {
      // Already unregistered through the signal.
    }
  }
}

/** Poll a signal-backed condition until it is true or the timeout expires. */
export function waitUntil(condition: () => boolean, timeoutMs = 8000, intervalMs = 50): Promise<boolean> {
  return new Promise((resolve) => {
    const started = Date.now();
    const tick = () => {
      if (condition()) return resolve(true);
      if (Date.now() - started >= timeoutMs) return resolve(false);
      setTimeout(tick, intervalMs);
    };
    tick();
  });
}

function exposeForLocalDebugging(tools: AnyWebMcpTool[], destroyRef: DestroyRef): void {
  if (environment.name !== 'local' || typeof window === 'undefined') return;
  const registry = ((window as unknown as Record<string, unknown>)[DEBUG_GLOBAL] ??= {}) as Record<
    string,
    AnyWebMcpTool['execute']
  >;
  for (const tool of tools) registry[tool.name] = tool.execute;
  destroyRef.onDestroy(() => {
    for (const tool of tools) {
      if (registry[tool.name] === tool.execute) delete registry[tool.name];
    }
  });
}
