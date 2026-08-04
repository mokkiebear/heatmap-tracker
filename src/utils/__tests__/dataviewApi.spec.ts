import { getDataviewApi } from "../dataviewApi";
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
