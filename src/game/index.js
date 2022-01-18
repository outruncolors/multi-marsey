import * as PIXI from "pixi.js";

// 1. Initialize game and load assets.
// * When adding a new asset, be sure to add it here as well.
const GAME_ASSETS = ["card", "empty_slot", "slot_selected"];

export async function load() {
  console.info("Loading assets.");

  return new Promise((resolve) =>
    PIXI.Loader.shared
      .add(GAME_ASSETS.map((asset) => `assets/${asset}.png`))
      .load(resolve)
  );
}

export function initialize() {
  console.info("Initializing new game.");
}
