import { useEffect, useMemo, useState } from "react";
import { App } from "obsidian";
import { ColorsList, Entry } from "src/types";
import { readNoteBodies } from "src/utils/report/noteBody";
import { buildReportModel } from "src/utils/report/reportModel";
import {
  buildHeatmapGridHtml,
  countBandsInRange,
} from "src/utils/report/heatmapHtml";
import { buildReportHtml } from "src/utils/report/reportHtml";
import { ExportOptions } from "./useExportOptions";

const PREVIEW_DEBOUNCE_MS = 300;

/** Reads the in-range notes' bodies (debounced) for the write-up section. */
function useNoteBodies(
  app: App,
  entriesByDate: Record<string, Entry>,
  startDate: string,
  endDate: string,
  enabled: boolean,
) {
  const [bodiesByPath, setBodiesByPath] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let ignore = false;
    const timer = window.setTimeout(() => {
      setIsLoading(true);

      const inRangePaths = Object.entries(entriesByDate)
        .filter(([date]) => date >= startDate && date <= endDate)
        .map(([, entry]) => entry.filePath)
        .filter((path): path is string => Boolean(path));

      readNoteBodies(app, inRangePaths)
        .then((bodies) => {
          if (ignore) return;
          setBodiesByPath(bodies);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error(
            "Heatmap Tracker: could not read notes for the export preview.",
            error,
          );
          // Without this the preview would stay stuck on its loading state.
          if (!ignore) setIsLoading(false);
        });
    }, PREVIEW_DEBOUNCE_MS);

    return () => {
      ignore = true;
      window.clearTimeout(timer);
    };
  }, [app, entriesByDate, startDate, endDate, enabled]);

  return { bodiesByPath, isLoading };
}

/**
 * Everything derived from the export options: the report model, the heatmap
 * grid HTML, the band count hint and the previewable HTML document. Kept out
 * of the component so the view file is markup plus handlers only.
 */
export function useReportPreview(args: {
  app: App;
  entriesByDate: Record<string, Entry>;
  colorsList: ColorsList;
  options: ExportOptions;
  rangeValid: boolean;
  title: string;
  generatedAt: string;
}) {
  const { app, entriesByDate, colorsList, options, rangeValid } = args;
  const {
    startDate,
    endDate,
    weekStartDay,
    orientation,
    splitByMonth,
    legend,
  } = options;

  const { bodiesByPath, isLoading } = useNoteBodies(
    app,
    entriesByDate,
    startDate,
    endDate,
    rangeValid,
  );

  const model = useMemo(() => {
    if (!rangeValid) return null;
    return buildReportModel({
      entriesByDate,
      colorsList,
      bodiesByPath,
      startDate,
      endDate,
      weekStartDay,
      legend,
    });
  }, [
    entriesByDate,
    colorsList,
    bodiesByPath,
    startDate,
    endDate,
    weekStartDay,
    legend,
    rangeValid,
  ]);

  const bandCount = useMemo(() => {
    if (!rangeValid) return 0;
    return countBandsInRange(
      startDate,
      endDate,
      weekStartDay,
      orientation,
      splitByMonth,
    );
  }, [rangeValid, startDate, endDate, weekStartDay, orientation, splitByMonth]);

  const heatmapGridHtml = useMemo(() => {
    if (!rangeValid) return "";
    return buildHeatmapGridHtml({
      entriesByDate,
      colorsList,
      startDate,
      endDate,
      weekStartDay,
      orientation,
      showWeekStartDate: options.showWeekStartDate,
      splitByMonth,
      showMonthLabels: options.showMonthLabels,
      skipWeekends: options.skipWeekends,
      legend,
    });
  }, [
    entriesByDate,
    colorsList,
    startDate,
    endDate,
    weekStartDay,
    orientation,
    options.showWeekStartDate,
    splitByMonth,
    options.showMonthLabels,
    options.skipWeekends,
    legend,
    rangeValid,
  ]);

  /** Shared by the HTML preview, the HTML export and the Markdown export. */
  const reportOptions = useMemo(
    () => ({
      title: args.title,
      generatedAt: args.generatedAt,
      heatmapHtml: heatmapGridHtml,
      valueLabel: options.valueLabel,
      legend,
      legendMode: options.legendMode,
      gradientLabel: options.gradientLabel,
      colorsList,
      hideSummary: options.hideSummary,
      hideTotalValue: options.hideTotalValue,
      hideAllValues: options.hideAllValues,
    }),
    [
      args.title,
      args.generatedAt,
      heatmapGridHtml,
      options.valueLabel,
      legend,
      options.legendMode,
      options.gradientLabel,
      colorsList,
      options.hideSummary,
      options.hideTotalValue,
      options.hideAllValues,
    ],
  );

  const reportHtmlDoc = useMemo(
    () => (model ? buildReportHtml(model, reportOptions) : ""),
    [model, reportOptions],
  );

  return { model, isLoading, bandCount, reportOptions, reportHtmlDoc };
}
