import { IHeatmapView } from "src/types";
import z from "zod";

export const UISchema = z.strictObject({
  /**
   * Hides the tabs in the heatmap view.
   */
  hideTabs: z.boolean().optional(),
  /**
   * Hides the year in the heatmap header.
   */
  hideYear: z.boolean().optional(),
  /**
   * Hides the title in the heatmap header.
   */
  hideTitle: z.boolean().optional(),
  /**
   * Hides the subtitle in the heatmap header.
   */
  hideSubtitle: z.boolean().optional(),
  /**
   * The default view to show when opening the heatmap tracker.
   * Default: IHeatmapView.HeatmapTracker
   */
  defaultView: z.enum(Object.values(IHeatmapView)).optional(),
});
