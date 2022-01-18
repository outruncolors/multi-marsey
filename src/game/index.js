import * as PIXI from "pixi.js";
import produce from "immer";
import { generateDeck } from "./chance";
import { Tink } from "./tink";
import {
  BOARD_SIZE,
  GAME_BACKGROUND_COLOR,
  GAME_SCREEN_WIDTH,
  GAME_SCREEN_HEIGHT,
  HAND_SIZE,
  PADDING_SMALL,
  CARD_WIDTH,
  GAME_SCALE,
  CARD_HEIGHT,
  SLOT_SIZE
} from "./config";
import { getTexture } from "./helpers";
import { createCard } from "./card";
import { createSlot } from "./slot";

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
    board: [],
    hand: [],
    deck: [],
    selectedCard: null
  };
}

let gameState;
let application;
let pointer;
let handContainer;
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

  // Create board from slots.
  gameState.board = Array.from({ length: BOARD_SIZE }, (_, y) => {
    const row = Array.from({ length: BOARD_SIZE }, (_, x) => {
      return {
        position: [y, x],
        owner: 0,
        card: null
      };
    });

    return row;
  });

  // Add the slot assets.
  const boardSprites = new PIXI.Container();
  const allSlotSprites = [];

  for (const row of gameState.board) {
    const rowSprites = new PIXI.Container();

    for (const slot of row) {
      const [y, x] = slot.position;
      const slotSprite = createSlot();

      slotSprite.boardPosition = [y, x];

      slotSprite.position.x = x * SLOT_SIZE * GAME_SCALE + PADDING_SMALL;

      rowSprites.addChild(slotSprite);

      allSlotSprites.push(slotSprite);
    }

    rowSprites.position.y =
      row[0].position[0] * SLOT_SIZE * GAME_SCALE + PADDING_SMALL;

    boardSprites.addChild(rowSprites);
  }

  application.stage.addChild(boardSprites);

  // Create deck of cards.
  gameState.deck = generateDeck();
  const deckSprite = getTexture("deck");
  deckSprite.position.set(
    PADDING_SMALL,
    GAME_SCREEN_HEIGHT - CARD_HEIGHT * GAME_SCALE - PADDING_SMALL
  );
  application.stage.addChild(deckSprite);

  // Deal some cards to the player.
  handContainer = dealHandToPlayer();

  // Wait for player to select a card.
  // pointer.press = () => {
  //   if (gameState.selectedCard) {
  //     deselectACard();
  //   }
  // };

  // Handle pointer/sprite interaction.
  application.ticker.add(() => {
    tink.update();

    // Slots
    let anySlotSelected = false;
    if (gameState.selectedCard) {
      allSlotSprites.forEach((slot) => {
        if (pointer.hitTestSprite(slot)) {
          slot.methods.select();
          anySlotSelected = true;

          if (pointer.isDown) {
            const [y, x] = slot.boardPosition;
            const boardSlot = gameState.board[y][x];

            if (!boardSlot.card) {
              console.info(
                "Playing ",
                gameState.selectedCard.title,
                " on slot ",
                boardSlot
              );

              // Play the card on the slot.
              playSelectedCardOn(slot.boardPosition);
            }
          }
        } else {
          slot.methods.deselect();
        }
      });

      pointer.cursor = anySlotSelected ? "pointer" : "auto";
    }

    if (!anySlotSelected) {
      // Cards
      let isPointing = false;
      let i = 0;
      for (const card of handContainer.children) {
        if (pointer.hitTestSprite(card)) {
          isPointing = true;

          if (pointer.isDown && !gameState.selectedCard) {
            selectACard(i);
          }
        }

        i++;
      }

      pointer.cursor = isPointing ? "pointer" : "auto";
    }
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
function selectACard(handIndex) {
  try {
    const nextState = produce(gameState, (state) => {
      const selectedCard = gameState.hand[handIndex];
      console.info("Player selected a card.", selectedCard);
      state.selectedCard = selectedCard;
    });

    gameState = nextState;

    // Move the card up a little bit.
    const selectedCardSprite = handContainer.children[handIndex];
    selectedCardSprite.position.y -= PADDING_SMALL;

    lastSelectedCardSprite = selectedCardSprite;
  } catch (error) {
    console.error("Unable to select a card.", error);
  }
}

function deselectACard() {
  if (lastSelectedCardSprite != null) {
    const nextState = produce(gameState, (state) => {
      console.info("Player deselected a card.");
      state.selectedCard = null;
    });

    gameState = nextState;

    lastSelectedCardSprite.position.y += PADDING_SMALL;
  }
}

function playSelectedCardOn([y, x]) {
  let playedCardIndex;
  const nextState = produce(gameState, (state) => {
    console.info(
      `Player played ${gameState.selectedCard.title} at ${y}, ${x}.`
    );
    state.board[y][x].card = state.selectedCard;
    state.hand = state.hand.filter((card, index) => {
      if (card.title !== state.selectedCard.title) {
        return true;
      }

      playedCardIndex = index;

      return false;
    });
    state.selectedCard = null;

    console.log("hc", handContainer.children);
  });

  gameState = nextState;

  // Remove played card asset from hand.
  handContainer.children[playedCardIndex].visible = false;
}

setInterval(() => console.info("STATE: ", gameState), 3000);
