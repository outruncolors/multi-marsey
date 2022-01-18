import * as PIXI from "pixi.js";
import { getTexture } from "./helpers";

export function createSlot() {
  const slot = new PIXI.Container();
  const empty = getTexture("empty_slot");
  const selected = getTexture("slot_selected");

  slot.addChild(empty, selected);

  return slot;
}
