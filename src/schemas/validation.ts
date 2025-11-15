import { ZodError } from "zod";
import { TrackerDataSchema } from "./trackerData.schema";
import { TrackerData } from "src/types";

// простой "левенштейн" для подсказок по опечаткам
function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0)
  );

  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // delete
        dp[i][j - 1] + 1, // insert
        dp[i - 1][j - 1] + cost // substitute
      );
    }
  }
  return dp[a.length][b.length];
}

const trackerAllowedKeys = [
  "year",
  "colorScheme",
  "entries",
  "showCurrentDayBorder",
  "basePath",
  "defaultEntryIntensity",
  "intensityScaleStart",
  "intensityScaleEnd",
  "intensityConfig",
  "separateMonths",
  "heatmapTitle",
  "heatmapSubtitle",
  "insights",
];

function suggestKeyName(badKey: string): string | null {
  let best: { key: string; dist: number } | null = null;

  for (const key of trackerAllowedKeys) {
    const dist = levenshtein(badKey, key);
    if (!best || dist < best.dist) {
      best = { key, dist };
    }
  }

  if (!best) return null;
  // эмпирически: если расстояние <= 3, считаем это «похоже»
  if (best.dist <= 3) return best.key;
  return null;
}

export function validateTrackerData(input: unknown): TrackerData {
  const result = TrackerDataSchema.safeParse(input);

  if (result.success) {
    return result.data;
  }

  // тут можно адаптировать формат под Notice / console и т.д.
  const error = result.error;

  const messages = formatZodError(error);
  throw new Error("Неверный формат TrackerData:\n" + messages.join("\n"));
}

function formatZodError(error: ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.join(".") || "root";

    // extra: подсказки по неизвестным ключам
    if (issue.code === "unrecognized_keys") {
      const parts: string[] = [];
      for (const key of issue.keys) {
        const suggestion = suggestKeyName(key);
        if (suggestion) {
          parts.push(
            `Неизвестное свойство "${key}" в "${path}". Возможно, имелось в виду "${suggestion}".`
          );
        } else {
          parts.push(`Неизвестное свойство "${key}" в "${path}".`);
        }
      }
      return parts.join(" ");
    }

    // стандартные сообщения
    // Примеры:
    //   entries.0.date: Required
    //   year: Expected number, received string
    return `${path}: ${issue.message}`;
  });
}
