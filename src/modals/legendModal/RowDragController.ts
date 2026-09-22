import { LegendEntry } from "src/utils/report/legend";

/**
 * Drag-to-reorder for legend rows. A row's "identity" for reordering is a
 * payload of entries — one for a normal row, every palette-color entry at
 * once for the gradient group row (see `reorderLegendEntries`). The payload
 * currently being dragged is shared across rows, hence one controller per
 * rendered list.
 */
export class RowDragController {
  private dragPayload: LegendEntry[] | null = null;

  constructor(
    private onDrop: (dragged: LegendEntry[], target: LegendEntry[]) => void,
  ) {}

  /**
   * Wires `row` up as both a drag source and a drop target for `payload`.
   * Returns an `arm()` callback to wire to the row's own grip handle's
   * `mousedown` — a drag may only start if the initiating mousedown was on
   * that handle, so clicking/selecting text in the label or number inputs
   * elsewhere in the row can't accidentally start reordering.
   */
  wire(row: HTMLElement, payload: LegendEntry[]): () => void {
    row.setAttribute("draggable", "true");
    let dragArmed = false;

    row.addEventListener("dragstart", (evt) => {
      if (!dragArmed) {
        evt.preventDefault();
        return;
      }
      this.dragPayload = payload;
      row.addClass("is-dragging");
      evt.dataTransfer?.setData("text/plain", "1");
      if (evt.dataTransfer) evt.dataTransfer.effectAllowed = "move";
    });
    row.addEventListener("dragend", () => {
      dragArmed = false;
      this.dragPayload = null;
      row.removeClass("is-dragging");
    });
    row.addEventListener("dragenter", (evt) => {
      if (!this.dragPayload || this.dragPayload === payload) return;
      evt.preventDefault();
      row.addClass("is-drag-over");
    });
    row.addEventListener("dragleave", (evt) => {
      // dragenter/dragleave fire on every nested-element boundary crossing
      // within the row too, not just when actually leaving it - only clear
      // the drop-target highlight once the pointer has genuinely left.
      const related = evt.relatedTarget as Node | null;
      if (related && row.contains(related)) return;
      row.removeClass("is-drag-over");
    });
    row.addEventListener("dragover", (evt) => {
      evt.preventDefault();
      if (evt.dataTransfer) evt.dataTransfer.dropEffect = "move";
    });
    row.addEventListener("drop", (evt) => {
      evt.preventDefault();
      row.removeClass("is-drag-over");
      const dragged = this.dragPayload;
      if (!dragged) return;
      this.dragPayload = null;
      this.onDrop(dragged, payload);
    });

    return () => {
      dragArmed = true;
    };
  }
}
