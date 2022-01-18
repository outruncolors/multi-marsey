import * as PIXI from "pixi.js";
import { getTexture } from "./helpers";
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  GAME_SCALE,
  PADDING_SMALL,
  PADDING_TINY
} from "./config";

const rarityToSymbolLookup = ["●", "■", "⯁", "★"];

export function createCard(config) {
  const { title, rarity, power } = config;
  const card = new PIXI.Container();
  const cardSprite = getTexture("card");

  const cardTitle = buildText(title);
  cardTitle.position.set(
    PADDING_TINY,
    CARD_HEIGHT * GAME_SCALE - cardTitle.height - PADDING_TINY
  );

  const cardRarity = buildText(rarityToSymbolLookup[rarity]);
  cardRarity.position.set(PADDING_TINY, PADDING_TINY);

  const cardPower = new PIXI.Container();
  cardPower.position.set(
    CARD_WIDTH * GAME_SCALE - cardPower.width - PADDING_SMALL - PADDING_TINY,
    PADDING_TINY * 2
  );

  const [top, right, bottom, left] = power;

  const topPower = buildText(top);
  topPower.position.set(0, -10);

  const rightPower = buildText(right);
  rightPower.position.set(10, 0);

  const bottomPower = buildText(bottom);
  bottomPower.position.set(0, 10);

  const leftPower = buildText(left);
  leftPower.position.set(-10, 0);

  cardPower.addChild(topPower, rightPower, bottomPower, leftPower);

  card.addChild(cardSprite, cardTitle, cardRarity, cardPower);

  return card;
}

// ===

function buildText(text, options = {}) {
  return new PIXI.Text(text, {
    fontSize: 14,
    ...options
  });
}
