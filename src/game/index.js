import * as PIXI from "pixi.js";
import produce from "immer";
import { generateDeck } from "./chance";
import {
  GAME_BACKGROUND_COLOR,
  GAME_SCALE,
  GAME_SCREEN_WIDTH,
  GAME_SCREEN_HEIGHT,
  HAND_SIZE
} from "./config";

// 1. Initialize game and load assets.
// * When adding a new asset, be sure to add it here as well.
const GAME_ASSETS = [
  "card",
  "card_back",
  "deck",
  "empty_slot",
  "slot_selected"
];

export async function load() {
  console.info("Loading assets.");

  let assetIndex = 0;
  PIXI.Loader.shared.onProgress.add(() => {
    console.info(`-- Loaded ${GAME_ASSETS[assetIndex]}`);
    assetIndex++;
  });

  for (const asset of GAME_ASSETS) {
    await new Promise((_resolve) => {
      PIXI.Loader.shared
        .add(`assets/${asset}.png`, {
          crossOrigin: "anonymous"
        })
        .load(_resolve);
    });
  }
}

function buildInitialState() {
  return {
    hand: [],
    deck: []
  };
}

let gameState;
let application;
export async function initialize(element) {
  console.info("Initializing new game.");

  // Create the PIXI application.
  application = new PIXI.Application({
    width: GAME_SCREEN_WIDTH,
    height: GAME_SCREEN_HEIGHT
  });

  application.renderer.backgroundColor = GAME_BACKGROUND_COLOR;

  element.appendChild(application.view);

  // Initialize the game state.
  gameState = buildInitialState();

  // Create deck of cards.
  gameState.deck = generateDeck();
  const deckSprite = getTexture("deck");
  application.stage.addChild(deckSprite);

  // Deal some cards to the player.
  dealHandToPlayer();

  console.log({ gameState });

  // Wait for player to select a card.
  // Once a card is selected,
  // -- click an empty slot to play the card,
  // -- or click anything else to de-select the card.

  return;
}

// Helpers
function getTexture(asset) {
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

function dealHandToPlayer() {
  console.info("Dealing initial hand to player.");

  try {
    // Update the state.
    const nextState = produce(gameState, (state) => {
      let i = 0;
      while (i < HAND_SIZE) {
        state.hand.push(state.deck.shift());
        i++;
      }
    });

    gameState = nextState;

    // Add the assets.
  } catch (error) {
    console.error("Unable to deal hand to player.", error);
  }
}
