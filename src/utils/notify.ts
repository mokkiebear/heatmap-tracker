import { Notice } from "obsidian";

export function notify(message: string, duration: number = 3000) {
  return new Notice(message, duration);
}