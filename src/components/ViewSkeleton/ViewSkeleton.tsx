/**
 * Placeholder shown while a lazily-loaded view is being fetched. It reserves
 * roughly the height of a heatmap so switching tabs does not collapse the
 * container and shift the surrounding note content.
 */
export function ViewSkeleton() {
  return (
    <div className="heatmap-tracker-skeleton" aria-hidden="true">
      <div className="heatmap-tracker-skeleton__block" />
    </div>
  );
}
