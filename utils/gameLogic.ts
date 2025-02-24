export type Card = {
  value: string;
  suit: string;
};

export type Player = {
  hand: Card[];
  books: string[];
};

const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS = ['♠', '♥', '♣', '♦'];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const value of VALUES) {
    for (const suit of SUITS) {
      deck.push({ value, suit });
    }
  }
  return shuffle(deck);
}

export function shuffle(array: Card[]): Card[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function dealCards(deck: Card[]): {
  playerHand: Card[];
  computerHand: Card[];
  remainingDeck: Card[];
} {
  const playerHand = deck.slice(0, 7);
  const computerHand = deck.slice(7, 14);
  const remainingDeck = deck.slice(14);

  return {
    playerHand,
    computerHand,
    remainingDeck,
  };
}

export function checkForBooks(hand: Card[]): string[] {
  const valueCount: { [key: string]: number } = {};
  hand.forEach((card) => {
    valueCount[card.value] = (valueCount[card.value] || 0) + 1;
  });

  return Object.entries(valueCount)
    .filter(([_, count]) => count === 4)
    .map(([value]) => value);
}

export function removeBooks(hand: Card[], books: string[]): Card[] {
  return hand.filter((card) => !books.includes(card.value));
}

export function hasCard(hand: Card[], value: string): boolean {
  return hand.some((card) => card.value === value);
}

export function transferCards(
  fromHand: Card[],
  toHand: Card[],
  value: string
): { fromHand: Card[]; toHand: Card[] } {
  const cardsToTransfer = fromHand.filter((card) => card.value === value);
  const newFromHand = fromHand.filter((card) => card.value !== value);
  const newToHand = [...toHand, ...cardsToTransfer];

  return {
    fromHand: newFromHand,
    toHand: newToHand,
  };
}

export function drawCard(deck: Card[]): { card: Card | null; remainingDeck: Card[] } {
  if (deck.length === 0) {
    return { card: null, remainingDeck: [] };
  }
  return {
    card: deck[0],
    remainingDeck: deck.slice(1),
  };
}

export function computerPickValue(hand: Card[], playerHand: Card[]): string {
  // Simple AI: randomly select a card value from the computer's hand
  const randomIndex = Math.floor(Math.random() * hand.length);
  return hand[randomIndex].value;
}