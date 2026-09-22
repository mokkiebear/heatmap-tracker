import type { App } from "obsidian";
import type { DataviewApi } from "obsidian-dataview";

/**
 * Local stand-in for `getAPI` from `obsidian-dataview`.
 *
 * Importing that function pulled the package's entire runtime (~112 KB, 16% of
 * the plugin) into the bundle for what is a four-line property lookup. Dataview
 * is a separate Obsidian plugin that is already loaded in the user's vault, so
 * all we need is a handle on the API object it installs — not its query engine.
 *
 * Behaviour mirrors the upstream implementation exactly: read the API off the
 * given app, or fall back to the global Dataview installs on `window`.
 * The `DataviewApi` type still comes from the package, but as a type-only
 * import it is erased at build time and costs nothing.
 */

/** `app.plugins` is not part of Obsidian's public typings. */
interface AppWithPlugins {
  plugins?: {
    plugins?: Record<string, { api?: DataviewApi } | undefined>;
    enabledPlugins?: Set<string>;
  };
}

interface WindowWithDataview {
  DataviewAPI?: DataviewApi;
}

export function getDataviewApi(app?: App): DataviewApi | undefined {
  if (app) {
    return (app as App & AppWithPlugins).plugins?.plugins?.dataview?.api;
  }

  return (window as Window & WindowWithDataview).DataviewAPI;
}

/**
 * Whether the user has Dataview turned on, regardless of whether it has
 * finished loading.
 *
 * The distinction matters: during Obsidian's startup a note can render before
 * Dataview has installed its API, and treating that moment as "no Dataview" —
 * and quietly answering from frontmatter alone — would drop every inline field
 * from a vault that has them.
 */
export function isDataviewEnabled(app: App): boolean {
  const plugins = (app as App & AppWithPlugins).plugins;

  return Boolean(
    plugins?.enabledPlugins?.has("dataview") || plugins?.plugins?.dataview,
  );
}

/** Dataview fires this on the metadata cache once its index is usable. */
const DATAVIEW_READY_EVENT = "dataview:index-ready";

/**
 * Resolves Dataview's API, waiting briefly when the plugin is enabled but has
 * not installed it yet. Only ever delays a render that would previously have
 * produced an empty heatmap, and always gives up after `timeoutMs`.
 */
export async function resolveDataviewApi(
  app: App,
  timeoutMs = 3000,
): Promise<DataviewApi | undefined> {
  const immediate = getDataviewApi(app) ?? getDataviewApi();
  if (immediate || !isDataviewEnabled(app)) {
    return immediate;
  }

  await new Promise<void>((resolve) => {
    const cache = app.metadataCache as App["metadataCache"] & {
      on?: (name: string, callback: () => void) => unknown;
      offref?: (ref: unknown) => void;
    };

    // `window.` prefix: plugin code can run inside a popout window, whose
    // globals are a different realm than the main window's.
    const timer = window.setTimeout(finish, timeoutMs);
    let ref: unknown;

    function finish() {
      window.clearTimeout(timer);
      if (ref) cache.offref?.(ref);
      resolve();
    }

    ref = cache.on?.(DATAVIEW_READY_EVENT, finish);

    // No event system to hook into (older Obsidian, or a test double): the
    // timeout is the only exit, so don't leave the render hanging on it.
    if (!ref) finish();
  });

  return getDataviewApi(app) ?? getDataviewApi();
}
