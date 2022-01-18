import * as PIXI from "pixi.js";
import { GAME_SCALE } from "./config";

export function getTexture(asset) {
  try {
    const sprite = new PIXI.Sprite(
      PIXI.Loader.shared.resources[`assets/${asset}.png`].texture
    );

    sprite.scale.set(GAME_SCALE, GAME_SCALE);

    return sprite;
  } catch (error) {
    console.error("Unable to get texture.", error);
  }
}
