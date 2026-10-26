import { setIcon } from "obsidian";

/**
 * Drag-to-reorder for modal rows. Each row carries a payload (a legend row's
 * entries, a preset's id) handed to `onDrop` with the payload of the row it
 * landed before. One controller per rendered list, since the payload being
 * dragged is shared across its rows.
 */
export class RowDragController<T> {
  private dragPayload: T | null = null;

  constructor(private onDrop: (dragged: T, target: T) => void) {}

  /**
   * Wires `row` up as both a drag source and a drop target for `payload`.
   * Returns an `arm()` callback to wire to the row's own grip handle's
   * `mousedown` — a drag may only start if the initiating mousedown was on
   * that handle, so clicking/selecting text in the label or number inputs
   * elsewhere in the row can't accidentally start reordering.
   */
  wire(row: HTMLElement, payload: T): () => void {
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

/** The grip that arms a row's drag; only a drag started here reorders. */
export function addDragHandle(row: HTMLElement, arm: () => void, cls: string) {
  const handle = row.createDiv({ cls });
  setIcon(handle, "grip-vertical");
  handle.addEventListener("mousedown", arm);
}
