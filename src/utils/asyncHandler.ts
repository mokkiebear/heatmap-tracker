import { notify } from "src/utils/notify";

/**
 * Wraps an async handler for APIs that expect a `void`-returning callback
 * (`addEventListener`, React's `onClick`, Obsidian's callbacks).
 *
 * Passing an `async` function directly returns a promise nobody awaits: if it
 * rejects, the failure surfaces as an unhandled rejection in the console and
 * the user sees a button that silently did nothing. This keeps the callback
 * `void` and turns a rejection into a Notice.
 */
export function asyncHandler<Args extends unknown[]>(
  handler: (...args: Args) => Promise<unknown>,
  message = "* Heatmap Tracker *\nSomething went wrong. See the developer console for details.",
): (...args: Args) => void {
  return (...args: Args) => {
    handler(...args).catch((error: unknown) => {
      console.error("Heatmap Tracker: an action failed.", error);
      notify(message, 5000);
    });
  };
}
