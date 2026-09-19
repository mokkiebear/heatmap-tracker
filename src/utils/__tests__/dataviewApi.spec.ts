import {
  getDataviewApi,
  isDataviewEnabled,
  resolveDataviewApi,
} from "../dataviewApi";
import type { App } from "obsidian";

/** Minimal shape of the API object Dataview installs. */
const api = { pages: () => [] } as unknown as ReturnType<typeof getDataviewApi>;

function appWith(plugins: Record<string, unknown>): App {
  return { plugins: { plugins } } as unknown as App;
}

describe("getDataviewApi", () => {
  const originalGlobal = (window as { DataviewAPI?: unknown }).DataviewAPI;

  afterEach(() => {
    (window as { DataviewAPI?: unknown }).DataviewAPI = originalGlobal;
  });

  it("reads the api off the given app", () => {
    expect(getDataviewApi(appWith({ dataview: { api } }))).toBe(api);
  });

  it("returns undefined when Dataview is not installed in that app", () => {
    expect(getDataviewApi(appWith({}))).toBeUndefined();
  });

  it("returns undefined when the dataview plugin exposes no api", () => {
    expect(getDataviewApi(appWith({ dataview: {} }))).toBeUndefined();
  });

  it("does not throw when app has no plugins registry at all", () => {
    expect(getDataviewApi({} as App)).toBeUndefined();
  });

  it("falls back to the window global when called without an app", () => {
    (window as { DataviewAPI?: unknown }).DataviewAPI = api;
    expect(getDataviewApi()).toBe(api);
  });

  it("returns undefined without an app when the global is absent", () => {
    delete (window as { DataviewAPI?: unknown }).DataviewAPI;
    expect(getDataviewApi()).toBeUndefined();
  });
});

interface FakeCache {
  on: jest.Mock;
  offref: jest.Mock;
  fire: () => void;
}

/** An app whose Dataview API only appears when the ready event fires. */
function appWithLateDataview(enabled: boolean) {
  const listeners: (() => void)[] = [];
  const plugins: Record<string, unknown> = {};

  const cache: FakeCache = {
    on: jest.fn((name: string, callback: () => void) => {
      if (name === "dataview:index-ready") listeners.push(callback);
      return { name };
    }),
    offref: jest.fn(),
    fire: () => {
      plugins.dataview = { api };
      listeners.forEach((listener) => listener());
    },
  };

  const app = {
    plugins: { plugins, enabledPlugins: new Set(enabled ? ["dataview"] : []) },
    metadataCache: cache,
  } as unknown as App;

  return { app, cache };
}

describe("isDataviewEnabled", () => {
  it("is true while the plugin is enabled but still loading", () => {
    const { app } = appWithLateDataview(true);

    expect(getDataviewApi(app)).toBeUndefined();
    expect(isDataviewEnabled(app)).toBe(true);
  });

  it("is false when the plugin is not enabled", () => {
    expect(isDataviewEnabled(appWithLateDataview(false).app)).toBe(false);
  });
});

describe("resolveDataviewApi", () => {
  const originalGlobal = (window as { DataviewAPI?: unknown }).DataviewAPI;

  afterEach(() => {
    (window as { DataviewAPI?: unknown }).DataviewAPI = originalGlobal;
    jest.useRealTimers();
  });

  it("returns the api without waiting when it is already there", async () => {
    const { app, cache } = appWithLateDataview(true);
    cache.fire();

    await expect(resolveDataviewApi(app)).resolves.toBe(api);
    // Nothing to wait for, so no listener should have been registered.
    expect(cache.on).not.toHaveBeenCalled();
  });

  it("waits for Dataview's index and then uses it", async () => {
    const { app, cache } = appWithLateDataview(true);

    const pending = resolveDataviewApi(app);
    expect(cache.on).toHaveBeenCalledWith(
      "dataview:index-ready",
      expect.any(Function),
    );

    cache.fire();

    await expect(pending).resolves.toBe(api);
    expect(cache.offref).toHaveBeenCalled();
  });

  it("gives up after the timeout so a render never hangs", async () => {
    jest.useFakeTimers();
    const { app } = appWithLateDataview(true);

    const pending = resolveDataviewApi(app, 3000);
    jest.advanceTimersByTime(3000);

    await expect(pending).resolves.toBeUndefined();
  });

  it("does not wait at all when Dataview is not enabled", async () => {
    delete (window as { DataviewAPI?: unknown }).DataviewAPI;
    const { app, cache } = appWithLateDataview(false);

    await expect(resolveDataviewApi(app)).resolves.toBeUndefined();
    expect(cache.on).not.toHaveBeenCalled();
  });
});
