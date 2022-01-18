import Chance from "chance";
import { DECK_SIZE } from "./config";

const CHANCE = new Chance();

export function generateCard() {
  // Cards have a title, a power diamond and a rarity.
  return {
    title: CHANCE.word({ capitalize: true }),
    rarity: CHANCE.integer({ min: 0, max: 3 }),
    power: Array.from({ length: 4 }, () => CHANCE.integer({ min: 1, max: 9 }))
  };
}

export function generateDeck() {
  return Array.from({ length: DECK_SIZE }, generateCard);
}
