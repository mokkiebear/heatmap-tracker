import { setIcon } from "obsidian";

/**
 * Drag-to-reorder for modal rows. Each row carries a payload (the items it
 * stands for) handed to `onDrop` with the payload of the row it landed
 * before. One controller per rendered list, since the payload being dragged
 * is shared across its rows.
 */
export class RowDragController<T> {
  private dragPayload: T | null = null;

  constructor(private onDrop: (dragged: T, target: T) => void) {}

  /**
   * Wires `row` up as both a drag source and a drop target for `payload`, and
   * adds a grip with class `handleCls`. A drag only starts from the grip, so
   * selecting text or using an input elsewhere in the row can't start one.
   * Without `handleCls` the row is only a drop target.
   */
  wire(row: HTMLElement, payload: T, handleCls?: string): void {
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

    if (handleCls) {
      const handle = row.createDiv({ cls: handleCls });
      setIcon(handle, "grip-vertical");
      handle.addEventListener("mousedown", () => {
        dragArmed = true;
      });
    }
  }
}

/**
 * Moves `dragged` (one item, or a block such as the gradient row's colors) to
 * just before the first item of `target` that isn't itself being dragged, or
 * to the end when there is none. Unchanged when dropped onto itself. Works by
 * identity, so a whole block moves as easily as one item.
 */
export function reorder<T>(items: T[], dragged: T[], target: T[]): T[] {
  const draggedSet = new Set(dragged);
  if (target.some((item) => draggedSet.has(item))) return items;

  const rest = items.filter((item) => !draggedSet.has(item));
  const anchor = target.find((item) => rest.includes(item));
  const insertIndex = anchor === undefined ? rest.length : rest.indexOf(anchor);

  return [
    ...rest.slice(0, insertIndex),
    ...dragged,
    ...rest.slice(insertIndex),
  ];
}
