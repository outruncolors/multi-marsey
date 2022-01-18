import * as PIXI from "pixi.js";
import produce from "immer";
import { generateDeck } from "./chance";
import { Tink } from "./tink";
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
    deck: [],
    selectedCard: null
  };
}

let gameState;
let application;
let pointer;
export async function initialize(element) {
  console.info("Initializing new game.");

  // Create the PIXI application.
  application = new PIXI.Application({
    width: GAME_SCREEN_WIDTH,
    height: GAME_SCREEN_HEIGHT
  });

  application.renderer.backgroundColor = GAME_BACKGROUND_COLOR;

  element.appendChild(application.view);

  // Prepare Tink to assist with user input.
  const tink = new Tink(PIXI, application.renderer.view);
  pointer = tink.makePointer();

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
  const hand = dealHandToPlayer();

  // Wait for player to select a card.
  pointer.press = (foo) => {
    if (gameState.selectedCard) {
      deselectACard();
    }
  };

  application.ticker.add(() => {
    tink.update();

    let isPointing = false;
    let i = 0;
    for (const card of hand.children) {
      if (pointer.hitTestSprite(card)) {
        isPointing = true;

        if (pointer.isDown && !gameState.selectedCard) {
          selectACard(hand.children, i);
        }
      }

      i++;
    }

    pointer.cursor = isPointing ? "pointer" : "auto";
  });

  // Once a card is selected,
  // -- click an empty slot to play the card,
  // -- or click anything else to de-select the card.
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

    // Return the collection for use elsewhere.
    return hand;
  } catch (error) {
    console.error("Unable to deal hand to player.", error);
  }
}

let lastSelectedCardSprite = null;
function selectACard(handContainer, handIndex) {
  try {
    const nextState = produce(gameState, (state) => {
      const selectedCard = gameState.hand[handIndex];
      console.info("Player selected a card.", selectedCard);
      state.selectedCard = selectedCard;
    });

    gameState = nextState;

    // Move the card up a little bit.
    const selectedCardSprite = handContainer[handIndex];
    selectedCardSprite.position.y -= PADDING_SMALL;

    lastSelectedCardSprite = selectedCardSprite;
  } catch (error) {
    console.error("Unable to select a card.", error);
  }
}

function deselectACard() {
  if (lastSelectedCardSprite) {
    const nextState = produce(gameState, (state) => {
      console.info("Player deselected a card.");
      state.selectedCard = null;
    });

    gameState = nextState;

    lastSelectedCardSprite.position.y += PADDING_SMALL;
  }
}
