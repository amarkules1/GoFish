import { create } from 'zustand';

interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: string;
}

interface Player {
  id: number;
  name: string;
  isComputer: boolean;
  hand: Card[];
  score: number;
}

interface GameState {
  players: Player[];
  deck: Card[];
  currentPlayerIndex: number;
  lastAction: string;
  hasExistingGame: boolean;
  initializeGame: (numPlayers: number) => void;
  dealCards: () => void;
  drawCard: (playerId: number, askedRank?: string) => Card | null;
  askForCard: (askingPlayerId: number, targetPlayerId: number, rank: string) => boolean;
  checkForPairs: (playerId: number) => void;
}

export const useStore = create<GameState>((set, get) => ({
  players: [],
  deck: [],
  currentPlayerIndex: 0,
  lastAction: '',
  hasExistingGame: false,

  initializeGame: (numPlayers) => {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    
    const deck = suits.flatMap(suit => 
      ranks.map(rank => ({ suit, rank }))
    );

    // Shuffle deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    const players = Array(numPlayers).fill(null).map((_, index) => ({
      id: index,
      name: index === 0 ? 'You' : `Computer ${index}`,
      isComputer: index !== 0,
      hand: [],
      score: 0,
    }));

    set({ 
      deck,
      players,
      currentPlayerIndex: 0,
      lastAction: 'Game started',
      hasExistingGame: true,
    });

    get().dealCards();
  },

  dealCards: () => {
    const { players, deck } = get();
    const newDeck = [...deck];
    const newPlayers = players.map(player => ({
      ...player,
      hand: newDeck.splice(0, 7),
    }));

    set({ players: newPlayers, deck: newDeck });
    
    // Check for initial pairs
    newPlayers.forEach(player => {
      get().checkForPairs(player.id);
    });
  },

  drawCard: (playerId, askedRank) => {
    const { deck, players } = get();
    if (deck.length === 0) return null;

    const newDeck = [...deck];
    const card = newDeck.pop()!;
    
    const newPlayers = players.map(player =>
      player.id === playerId
        ? { ...player, hand: [...player.hand, card] }
        : player
    );

    const player = players.find(p => p.id === playerId)!;
    const message = askedRank 
      ? `${player.name} asked for ${askedRank}s - Go Fish! Drew a card.`
      : `${player.name} drew a card`;

    set({ 
      deck: newDeck,
      players: newPlayers,
      lastAction: message,
    });

    // Check for pairs after drawing
    get().checkForPairs(playerId);
    return card;
  },

  askForCard: (askingPlayerId, targetPlayerId, rank) => {
    const { players } = get();
    const askingPlayer = players.find(p => p.id === askingPlayerId)!;
    const targetPlayer = players.find(p => p.id === targetPlayerId)!;

    const matchingCards = targetPlayer.hand.filter(card => card.rank === rank);
    
    if (matchingCards.length > 0) {
      const newPlayers = players.map(player => {
        if (player.id === askingPlayerId) {
          return {
            ...player,
            hand: [...player.hand, ...matchingCards],
          };
        }
        if (player.id === targetPlayerId) {
          return {
            ...player,
            hand: player.hand.filter(card => card.rank !== rank),
          };
        }
        return player;
      });

      set({
        players: newPlayers,
        lastAction: `${askingPlayer.name} got ${matchingCards.length} ${rank}(s) from ${targetPlayer.name}`,
      });

      // Check for pairs after receiving cards
      get().checkForPairs(askingPlayerId);
      return true;
    }

    set({
      lastAction: `${askingPlayer.name} asked ${targetPlayer.name} for ${rank}s - Go Fish!`,
    });
    return false;
  },

  checkForPairs: (playerId) => {
    const { players } = get();
    const player = players.find(p => p.id === playerId)!;
    
    // Count cards by rank
    const rankCounts = player.hand.reduce((acc, card) => {
      acc[card.rank] = (acc[card.rank] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Find ranks with exactly 2 cards (pairs)
    const pairs = Object.entries(rankCounts)
      .filter(([_, count]) => count === 2)
      .map(([rank]) => rank);

    if (pairs.length > 0) {
      const newPlayers = players.map(p => {
        if (p.id === playerId) {
          return {
            ...p,
            // Remove paired cards and keep one of each triple
            hand: p.hand.filter(card => {
              const count = rankCounts[card.rank];
              if (count === 2) return false; // Remove pairs
              if (count === 3) {
                // Keep only one card for triples
                rankCounts[card.rank]--;
                return rankCounts[card.rank] >= 1;
              }
              return true;
            }),
            // Add 2 points for each pair
            score: p.score + (pairs.length * 2),
          };
        }
        return p;
      });

      set({
        players: newPlayers,
        lastAction: `${player.name} matched ${pairs.length} pair(s) of ${pairs.join(', ')}s!`,
      });
    }

    // Check if game is over (all cards are matched)
    const totalCards = players.reduce((sum, p) => sum + p.hand.length, 0) + get().deck.length;
    if (totalCards === 0) {
      const winner = [...players].sort((a, b) => b.score - a.score)[0];
      const isTie = players.filter(p => p.score === winner.score).length > 1;
      set({
        lastAction: isTie 
          ? `Game Over! It's a tie with ${winner.score} points!`
          : `Game Over! ${winner.name} wins with ${winner.score} points!`,
      });
    }
  },
}));