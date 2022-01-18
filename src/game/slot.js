import * as PIXI from "pixi.js";
import { getTexture } from "./helpers";

export function createSlot() {
  const slot = new PIXI.Container();
  const empty = getTexture("empty_slot");
  const selected = getTexture("slot_selected");

  selected.alpha = 0.5;
  selected.visible = false;

  slot.addChild(empty, selected);

  slot.methods = {
    select() {
      selected.visible = true;
    },
    deselect() {
      selected.visible = false;
    }
  };

  return slot;
}
