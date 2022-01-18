import * as PIXI from "pixi.js";
import produce from "immer";
import { generateDeck } from "./chance";
import {
  GAME_BACKGROUND_COLOR,
  GAME_SCREEN_WIDTH,
  GAME_SCREEN_HEIGHT,
  HAND_SIZE,
  PADDING_SMALL,
  CARD_WIDTH,
  GAME_SCALE,
  CARD_HEIGHT
} from "./config";
import { getTexture } from "./helpers";
import { createCard } from "./card";

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
  deckSprite.position.set(
    PADDING_SMALL,
    GAME_SCREEN_HEIGHT - CARD_HEIGHT * GAME_SCALE - PADDING_SMALL
  );
  application.stage.addChild(deckSprite);

  // Deal some cards to the player.
  dealHandToPlayer();

  const hand = new PIXI.Container();
  hand.position.y =
    GAME_SCREEN_HEIGHT - CARD_HEIGHT * GAME_SCALE - PADDING_SMALL;

  let i = 1; // Factor in the deck itself.
  for (const dealtCard of gameState.hand) {
    const dealtCardSprite = createCard(dealtCard);
    dealtCardSprite.position.x =
      CARD_WIDTH * GAME_SCALE * i + PADDING_SMALL * 2;
    hand.addChild(dealtCardSprite);
    i++;
  }

  application.stage.addChild(hand);

  console.log({ gameState });

  // Wait for player to select a card.
  // Once a card is selected,
  // -- click an empty slot to play the card,
  // -- or click anything else to de-select the card.

  return;
}

// Helpers
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
