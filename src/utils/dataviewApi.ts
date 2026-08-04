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
